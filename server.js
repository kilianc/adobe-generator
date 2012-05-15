require('console-trace')({ always: true, right: true })

var http = require('http'),
    fs = require('fs'),
    fork = require('child_process').fork,
    io = require('socket.io'),
    express = require('express')

// server config
var app = express()
var server = http.createServer(app)
var io = io.listen(server)

// photoshop data
var layers = null
var currentDocument = null
var currentDocumentWatcher = null
var activeTool = null
var fontList = null

io.set('log level', 0)
io.sockets.on('connection', function (socket) {
  socket.on('move', function (layerId, x, y) {
    psConnection.send({ name: 'move', data: { layerId: layerId, x: x, y: y } })
  }).on('selectTool', function (toolId) {
    psConnection.send({ name: 'selectTool', data: toolId })
  }).on('setLayerFont', function (layerId, font) {
    psConnection.send({ name: 'setLayerFont', data: { layerId: layerId, font: font } })
  })
  io.sockets.emit('fontList', fontList)
  io.sockets.emit('layers', layers)
  io.sockets.emit('currentDocumentChanged', currentDocument)
})

app.use(express.static(__dirname + '/public'))
server.listen(process.env.PORT || 80)

// ugliest thig eva.
var psConnection
(function spawn() {
  psConnection && psConnection.kill()
  psConnection = fork(__dirname + '/lib/photoshop_process.js')
  psConnection.on('message', function (message) {
    if (message.name === 'error') {
      console.warn(' • motherlover::respawning -> %s', message.err.message)
      return spawn()
    }
    onMessage(message)
  })
})()

function onMessage(message) {
  switch (message.name) {
    case 'connect':
      console.info(' • motherlover::connected')
      io.sockets.emit('motherlover::connect')
    break
    case 'error':
      console.error(' • motherlover::error %s', message.err.message)
      io.sockets.emit('motherlover::disconnect')
    break
    case 'currentDocumentChanged':
      console.info(' • motherlover::currentDocumentChanged', message.data)
      currentDocument = message.data
      io.sockets.emit('currentDocumentChanged', message.data)
    break
    case 'layers':
      console.info(' • motherlover::layers', message.data.map(function (layer) { return layer.name }))
      layers = message.data
      io.sockets.emit('layers', message.data)
    break
    case 'toolChanged':
      console.info(' • motherlover::toolChanged', message.data)
      activeTool = message.data
      io.sockets.emit('toolChanged', message.data)
    break
    case 'fontList':
      console.info(' • motherlover::fontList', message.data.length)
      fontList = message.data
    break
    default:
      console.info(' • motherlover::%s', message.name, message.data)
      io.sockets.emit(message.name, message.data)
  }
}