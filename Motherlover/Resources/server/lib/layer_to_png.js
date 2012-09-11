var fs = require('fs'),
    PSD = require('../vendor/psd').PSD,
    Canvas = require('canvas')

module.exports = function layerToPng(id, psdPath, pngPath, callback) {
  var notFound = false
  var psd = PSD.fromFile(psdPath)
  psd.setOptions({ layerImages: true })
  psd.parse()
  notFound = psd.layers.every(function (layer) {
    if (layer.layerId != id) return true

    var canvas = new Canvas()
    layer.image.toCanvas(canvas)
    canvas.createPNGStream()
      .pipe(fs.createWriteStream(pngPath))
      .once('close', callback)

    return false
  })

  if (notFound) {
    callback(new Error('not found: ' + id))
  }
}