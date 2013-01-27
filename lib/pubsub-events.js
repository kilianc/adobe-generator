module.exports = {
  layerChangedPixels: function (err, data, ps, sio) {
  },
  layerChangedName: function (err, data) {
    var layer = layers[data.layerId]

    if (layer.kind === 'LayerKind.NORMAL') {
      // rename the asset and notify
      return
    }

    var pngRegExp = /\.png$/
    var oldName = layer.name
    var newName = data.layerName

    if (pngRegExp.test(oldName) === pngRegExp.test(newName)) {
      // just notify the change
      return
    }

    if (pngRegExp.test(newName)) {
      // save png and notify when ready
    }
  },
  layerChangedOpacity: function (err, data) {
    // notify data.layerId, data.value
  },
  layerChangedProtection: function (err, data) {
  },
  layerChangedPosition: function (err, data) {
    // notify data.layerId, data.value
  },
  layerChangedVisibility: function (err, data) {
    // notify data.layerId, data.value
  },
  layerRemoved: function (err, data) {
    var layer = layers[data.layerId]

    if (layer.kind === 'LayerKind.NORMAL' || isLayerAsset(layer.name)) {
      // remove asset
    }

    // notify data.layerId
  },
  layerAdded: function (err, data) {
    // add layer to datamodel
    var layer = layers[data.layerId]

    if (layer.kind === 'LayerKind.NORMAL' || isLayerAsset(layer.name)) {
      // create asset and notify when ready
    }

    // notify new layer
  },
  documentChangedLayerOrder: function (err, data) {
    // no idea how is going to work/respond with
  },
  closedDocument: function (err, data) {
    var layer = layers[data.layerId]

    if (layer.kind === 'LayerKind.NORMAL' || isLayerAsset(layer.name)) {
      // remove asset
    }

    // notify data.layerId
  },
  layerChangedGeneratedContent: function (err, data) {
    // if the layer is a basic shape (rect, ellipse, rounded rect) update css
    // else get the new svg
  },
  layerChangedBlendMode: function (err, data) {
  },
  layerChangedText: function (err, data) {
    // rebuild the text layer
    // if just one style/paragraph just update text
  },
  layerChangedPath: function (err, data) {
    // if the layer is a basic shape (rect, ellipse, rounded rect) update css
    // else get the new svg
  },
  layerChangedTransform: function (err, data) {
    // ?
  },
  layerChangedFX: function (err, data) {
  },
  layerChangedRasterize: function (err, data) {
  },
  currentDocumentChanged: function (err, data) {
    self.photoshop.execute(jsx.getActiveDocumentPath, function (err, response) {
      if (err) return self.emit('error', err, response)

      self.photoshopData.currentDocumentPath = response.body ? JSON.parse(response.body) : 'NOT_SAVED_YET'
      self.photoshopData.imagesPath = dirname(self.photoshopData.currentDocumentPath)
      self.emit('currentDocumentChanged', self.photoshopData.currentDocumentPath)
    })
  }
}

function isLayerAsset(layerName) {
  return /\.png$/.test(layerName)
}

function parsePubSubData(data) {
  var data = data.split(',')
  return { documentId: data[0], layerId: data[1] }
}

function prepareLayerData(layer) {
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