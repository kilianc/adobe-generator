var layers = Array.prototype.slice.call(app.activeDocument.layers)

JSON.stringify(layers.map(function (layer) {
  return getLayerData(app.activeDocument, layer)
}))