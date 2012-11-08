var EventEmitter = require('events').EventEmitter,
    photoshop = require('./photoshop'),
    jsx = require('../jsx')

var Motherlover = module.exports = function Motherlover(app, sio) {
  if (!(this instanceof Motherlover)) return new Motherlover(app, sio)

  this.photoshopData = {}
  this.sio = sio
  this.app = app

  sio.sockets.on('connection', function (socket) {
    sio.sockets.emit('layers', this.photoshopData.layers || [])
    sio.sockets.emit('currentDocumentChanged', this.photoshopData.currentDocumentPath || '')
  })

  app.use(express.static(__dirname + '/../public'))
}

Motherlover.prototype.__proto__ = EventEmitter.prototype

Motherlover.prototype.connect = function connect(host, port, password, timeout, callback) {
  var self = this

  self.photoshop && self.photoshop.destroy()
  self.photoshop = photoshop()

  self.photoshopData = {
    layers: null,
    currentDocumentPath: null,
    fontList: null,
    imagesPath: 'public/images/layers/'
  }

  self.photoshop.on('error', function onPSError(err) {
    self.emit('error', err)
  })

  self.photoshop.connect(host, port, password, timeout, function onPSConnect() {
    self.photoshop.execute(photoshopScripts.isScriptingSupportUpdated, function (err, response) {
      // test scripting support
      if (!err && response.body !== 'true') {
        err = new Error(response.body)
        err.code = 'ESCRIPTPSUPP'
        self.emit('error', err)
        return
      }

      if (!err) {
        //
      }

      callback && callback()
    })
  })
}

Motherlover.prototype.close = function close() {
  this.photoshop && this.photoshop.destroy()
  this.photoshopData = {}
}

Motherlover.prototype.prepareLayerData = function prepareLayerData(layer) {
  var self = this

  if (/\.png$/.test(layer.name)) {
    layer.kind = 'LayerKind.NORMAL'
  } else {
    layer.name += '.png'
  }

  if (layer.kind === 'LayerKind.NORMAL' && this.photoshopData.currentDocumentPath !== 'NOT_SAVED_YET') {
    layerToPng(layer.id, this.photoshopData.currentDocumentPath, this.photoshopData.imagesPath + layer.name, function (err) {
      if (err) {
        self.emit('error', err)
      } else {
        layer.isPngReady = true
        self.emit('layerPngReady', layer)
      }
    })
  }

  return layer
}