var EventEmitter = require('events').EventEmitter,
    photoshop = require('./photoshop'),
    photoshopScripts = require('./photoshopScripts'),
    layerToPng = require('./layer_to_png')

var Motherlover = module.exports = function Motherlover() {
  if (!(this instanceof Motherlover)) {
    return new Motherlover()
  }
  this.photoshopData = {}
}

Motherlover.prototype.__proto__ = EventEmitter.prototype

Motherlover.prototype.connect = function connect(host, port, password, callback) {
  var self = this

  self.photoshop && self.photoshop.destroy()
  self.photoshop = photoshop()
  // this.photoshop.log = true
  self.photoshopData = {
    layers: null,
    currentDocumentPath: null,
    fontList: null,
    imagesPath: 'public/images/layers/'
  }

  var timeout = setTimeout(function () {
    var err = new Error('Connection timedout')
    err.code = 'ETIMEOUT'
    self.photoshop.emit('error', err)
  }, 200)

  self.photoshop.on('error', function onPSError(err) {
    if (err.code === 'ECONNREFUSED') {
      clearTimeout(timeout)
      self.close()
      callback && callback(err)
    } else if (err.code === 'EPIPE' || err.code === 'ECONNRESET' || err.code === 'ETIMEOUT') {
      self.close()
    }
    self.emit('error', err)
  })

  self.photoshop.connect(host, port, password, function onPSConnect() {
    // test password
    self.photoshop.execute('"THE_PASSWORD_IS_RIGHT"', function (err, response) {
      clearTimeout(timeout)

      if (response.body !== 'THE_PASSWORD_IS_RIGHT') {
        err = new Error(response.body)
        err.code = 'ECONNRESET'
        self.emit('error', err)
        return
      }

      self.photoshop.execute(photoshopScripts.isScriptingSupportUpdated, function (err, response) {
        // test scripting support
        if (response.body !== 'true') {
          err = new Error(response.body)
          err.code = 'ESCRIPTPSUPP'
          self.emit('error', err)
          return
        }
        callback(err)

        // subscriptions
        self.photoshop.subscribe('currentDocumentChanged').emit('currentDocumentChanged')
        self.photoshop.subscribe('documentChanged').emit('documentChanged')

        self.photoshop.execute(photoshopScripts.getFontList, function (err, response) {
          if (err) {
            self.emit('error', err, response)
          } else {
            self.photoshopData.fontList = JSON.parse(response.body)
          }
        })
      })
    })
  })

  self.photoshop.on('currentDocumentChanged', function (err, documentId) {
    self.photoshop.execute(photoshopScripts.getActiveDocumentPath, function (err, response) {
      if (err) {
        self.emit('error', err, response)
      } else {
        self.photoshopData.currentDocumentPath = response.body ? JSON.parse(response.body) : 'NOT_SAVED_YET'
        self.emit('currentDocumentChanged', self.photoshopData.currentDocumentPath)
      }
    })
  })

  self.photoshop.on('documentChanged', function (err, data) {
    self.photoshop.execute(photoshopScripts.getLayersData, function (err, response) {
      if (err) {
        self.emit('error', err, response)
      } else {
        self.photoshopData.layers = response.body ? JSON.parse(response.body) : []
        self.photoshopData.layers.forEach(self.prepareLayerData.bind(self))
        self.emit('layers', self.photoshopData.layers)
      }
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
  } else if (layer.kind === 'LayerKind.TEXT') {
    layer.textSize = layer.textSize
  }

  return layer
}