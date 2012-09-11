function map(fn) {
  var map = []
  for (var i = 0, l = this.length; i < l; i++) {
    map.push(fn(this[i]))
  }
  return map
}

JSON.stringify(map.call(app.activeDocument.layers, function (layer) {
  return getLayerData(app.activeDocument, layer)
}))