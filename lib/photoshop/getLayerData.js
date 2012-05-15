function getLayerData(doc, layer, index) {
  var layerData = {
    id: getLayerID(index),
    name: layer.name,
    kind: layer.kind.toString(),
    bounds: [layer.bounds[0].as('px'), layer.bounds[1].as('px'), layer.bounds[2].as('px'), layer.bounds[3].as('px')],
    opacity: layer.opacity,
    isVisible: layer.visible,
    index: index,
    isSelected: doc.activeLayer == layer
  }

  if (layerData.kind === 'LayerKind.TEXT') {
    var textItem = layer.textItem
    layerData.textContent = textItem.contents
    layerData.textColor = textItem.color
    layerData.textFont = textItem.font
    layerData.textSize = textItem.size.value
  } else if (layerData.kind === 'LayerKind.SOLIDFILL') {
    layerData.fillColor = getFillLayerColor(index)
  }

  return layerData
}

function getLayerAttrByIndex(index, key) {
  var ref = new ActionReference()
  ref.putProperty(app.charIDToTypeID('Prpr'), key)
  ref.putIndex(app.charIDToTypeID('Lyr '), index)
  return executeActionGet(ref)
}

function getLayerID(index) {
  var key = app.charIDToTypeID('LyrI')
  return getLayerAttrByIndex(index, key).getString(key)
}

function getFillLayerColor(index) {
  var key = app.charIDToTypeID('Adjs')
  var layerDesc = getLayerAttrByIndex(index, key)
  var color = new SolidColor()
  var adjDesc = layerDesc.getList(app.charIDToTypeID('Adjs')).getObjectValue(0)
  var clrDesc = adjDesc.getObjectValue(app.charIDToTypeID('Clr '))
  color.rgb.red = clrDesc.getDouble(app.charIDToTypeID('Rd  '))
  color.rgb.green = clrDesc.getDouble(app.charIDToTypeID('Grn '))
  color.rgb.blue = clrDesc.getDouble(app.charIDToTypeID('Bl  '))
  return color.rgb.hexValue
}