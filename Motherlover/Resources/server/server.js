var http = require('http'),
    fs = require('fs'),
    io = require('socket.io'),
    express = require('express'),
    freeport = require('freeport'),
    rimraf = require('rimraf'),
    cocoa = require('./lib/cocoa')(15000),
    motherlover = require('./lib/motherlover')

// cleanup
rimraf.sync(__dirname + '/public/images/layers')
fs.mkdirSync(__dirname + '/public/images/layers')

// PS connection
var motherloverClient = motherlover()
motherloverClient.on('layers', function (layers) {
  io.sockets.emit('layers', layers)
  process.cocoaSend({ name: 'layers', data: layers })
}).on('currentDocumentChanged', function (currentDocumentPath) {
  io.sockets.emit('currentDocumentChanged', currentDocumentPath)
  process.cocoaSend({ name: 'currentDocumentChanged', data: currentDocumentPath })
}).on('layerPngReady', function (layer) {
  io.sockets.emit('layerPngReady', layer.id)
  process.cocoaSend({ name: 'layerPngReady', data: layer.id })
}).on('error', function (err, response) {
  process.cocoaSend({ name: 'error', data: {
    message: err.message,
    stack: err.stack,
    response: response,
    code: err.code
  } })
})

process.on('cocoaMessage', function (message) {
  message.name !== 'ping' && process.cocoaSend({ name: 'back', message: message })
  switch (message.name) {
    case 'connect':
      motherloverClient.connect(message.host, message.port, message.password, function (err) {
        if (!err) {
          process.cocoaSend({ name: 'connected' })
        }
      })
    break
    case 'disconnect':
      motherloverClient.close()
      process.cocoaSend({ name: 'disconnected' })
    break
  }
})

// http server
var app = express()
var server = http.createServer(app)
var io = io.listen(server, { log: false })

io.sockets.on('connection', function (socket) {
  io.sockets.emit('fontList', motherloverClient.photoshopData.fontList || [])
  io.sockets.emit('layers', motherloverClient.photoshopData.layers || [])
  io.sockets.emit('currentDocumentChanged', motherloverClient.photoshopData.currentDocumentPath || '')
})

app.use(express.static(__dirname + '/public'))

freeport(function(err, port) {
  server.listen(port)
  process.cocoaSend({ name: 'httpPort', data: port })
})

process.on('uncaughtException', function (err) {
  process.cocoaSend({ name: 'error', data: { message: err.message, stack: err.stack, code: 'UNCAUGHT_EXCEPTION' } })
  console.error(err)
  process.kill()
})