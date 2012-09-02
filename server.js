var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    io = require('socket.io'),
    express = require('express'),
    layerToPng = require('./lib/layer_to_png'),
    photoshop = require('./lib/photoshop'),
    photoshopScripts = require('./lib/photoshop/'),
    fixPsdPath = require('./lib/fix_psd_path'),
    cocoa = require('./lib/cocoa_ipc')(1600000)

// stuff to do if the server is not wrapped
if (!process.env.ML_WRAPPER) {
  require('console-trace')({ always: true, right: true })
  cocoa.send = console.log.bind(console)
}

// photoshop config
var photoshop = photoshop()
var photoshopData = {
  layers: null,
  currentDocumentPath: null,
  currentDocumentWatcher: null,
  activeTool: null,
  fontList: null
}

// photoshop connection constants
var POOL_TIME = Number(process.env.POOL_TIME) || 500
var PNG_PATH = __dirname + '/public/images/layers/'

// photoshop.log = true
photoshop.on('connect', function () {
  io.sockets.emit('motherlover::connect')
  cocoa.send({ name: 'connect' })
})

photoshop.on('error', function (err) {
  cocoa.send({ name: 'error', data: { message: err.message, stack: err.stack } })
})

photoshop.connect('127.0.0.1', 49494, 'password', function () {
  // subscriptions
  photoshop
    .subscribe('currentDocumentChanged')
    .subscribe('documentChanged')

  photoshop.on('currentDocumentChanged', function (err, documentId) {
    photoshop.execute(photoshopScripts.getActiveDocumentPath, function (err, response) {
      photoshopData.currentDocumentPath = fixPsdPath(JSON.parse(response.body))
      io.sockets.emit('currentDocumentChanged', photoshopData.currentDocumentPath)
      cocoa.send({ name: 'currentDocumentChanged', data: photoshopData.currentDocumentPath })
    })
  }).emit('currentDocumentChanged')

  photoshop.on('documentChanged', function (err, data) {
    photoshop.execute(photoshopScripts.getLayersData, function (err, response) {
      if (err) {
        cocoa.send({ name: 'error', data: { message: err.message, stack: err.stack, response: response.body } })
      } else {
        photoshopData.layers = JSON.parse(response.body)
        photoshopData.layers.forEach(prepareLayerData.bind(null, photoshopData.currentDocumentPath, PNG_PATH))
        io.sockets.emit('layers', photoshopData.layers)
        cocoa.send({ name: 'layers', data: photoshopData.layers })
      }
    })
  }).emit('documentChanged')

  photoshop.execute(photoshopScripts.getFontList, function (err, response) {
    if (err) {
      cocoa.send({ name: 'error', data: { message: err.message, stack: err.stack } })
    } else {
      photoshopData.fontList = JSON.parse(response.body)
      cocoa.send({ name: 'fontList', data: photoshopData.fontList })
    }
  })
})

function prepareLayerData(currentDocumentPath, pngPath, layer) {
  if (/\.png$/.test(layer.name)) {
    layer.kind = 'LayerKind.NORMAL'
  } else {
    layer.name += '.png'
  }

  if (layer.kind === 'LayerKind.NORMAL') {
    layerToPng(layer.id, currentDocumentPath, pngPath + layer.name, function (err) {
      if (err) {
        cocoa.send({ name: 'error', data: { message: err.message, stack: err.stack } })
      } else {
        layer.isPngReady = true
        io.sockets.emit('layerPngReady', layer.id)
        cocoa.send({ name: 'layerPngReady', data: layer.id })
      }
    })
  } else if (layer.kind === 'LayerKind.TEXT') {
    layer.textSize = layer.textSize
  }

  return layer
}

// http server
var app = express()
var server = http.createServer(app)
var io = io.listen(server, { log: false })

io.sockets.on('connection', function (socket) {
  io.sockets.emit('fontList', photoshopData.fontList)
  io.sockets.emit('layers', photoshopData.layers)
  io.sockets.emit('currentDocumentChanged', photoshopData.currentDocumentPath)
})

app.use(express.static(__dirname + '/public'))
server.listen(process.env.PORT || 80)

process.on('uncaughtException', function (err) {
  cocoa.send({ name: 'error', data: { message: err.message, stack: err.stack } })
  process.kill()
})