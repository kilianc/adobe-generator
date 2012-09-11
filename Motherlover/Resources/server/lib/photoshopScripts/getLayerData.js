var enumMap = {}
// align
enumMap[stringIDToTypeID('left')] = 'left'
enumMap[stringIDToTypeID('center')] = 'center'
enumMap[stringIDToTypeID('right')] = 'right'
enumMap[stringIDToTypeID('justifyLeft')] = 'justifyLeft'
enumMap[stringIDToTypeID('justifyCenter')] = 'justifyCenter'
enumMap[stringIDToTypeID('justifyRight')] = 'justifyRight'
enumMap[stringIDToTypeID('justifyAll')] = 'justifyAll'
// fontCaps
enumMap[stringIDToTypeID('normal')] = 'normal'
enumMap[stringIDToTypeID('allCaps')] = 'allCaps'
enumMap[stringIDToTypeID('smallCaps')] = 'smallCaps'
// baseline
enumMap[stringIDToTypeID('superScript')] = 'superScript'
enumMap[stringIDToTypeID('subScript')] = 'subScript'
// autoKern
enumMap[stringIDToTypeID('opticalKern')] = 'opticalKern'
enumMap[stringIDToTypeID('metricsKern')] = 'metricsKern'
// strikethrough
enumMap[stringIDToTypeID('strikethroughOff')] = 'strikethroughOff'
enumMap[stringIDToTypeID('xHeightStrikethroughOn')] = 'xHeightStrikethroughOn'
// underline
enumMap[stringIDToTypeID('underlineOff')] = 'underlineOff'
enumMap[stringIDToTypeID('underlineOnLeftInVertical')] = 'underlineOnLeftInVertical'


var idMap = {}
idMap['textKey'] = stringIDToTypeID('textKey')
idMap['textStyleRange'] = stringIDToTypeID('textStyleRange')
idMap['from'] = stringIDToTypeID('from')
idMap['to'] = stringIDToTypeID('to')
idMap['textStyle'] = stringIDToTypeID('textStyle')
idMap['fontPostScriptName'] = stringIDToTypeID('fontPostScriptName')
idMap['fontName'] = stringIDToTypeID('fontName')
idMap['fontStyleName'] = stringIDToTypeID('fontStyleName')
idMap['size'] = stringIDToTypeID('size')
idMap['horizontalScale'] = stringIDToTypeID('horizontalScale')
idMap['verticalScale'] = stringIDToTypeID('verticalScale')
idMap['syntheticBold'] = stringIDToTypeID('syntheticBold')
idMap['syntheticItalic'] = stringIDToTypeID('syntheticItalic')
idMap['autoLeading'] = stringIDToTypeID('autoLeading')
idMap['leading'] = stringIDToTypeID('leading')
idMap['tracking'] = stringIDToTypeID('tracking')
idMap['baselineShift'] = stringIDToTypeID('baselineShift')
idMap['autoKern'] = stringIDToTypeID('autoKern')
idMap['fontCaps'] = stringIDToTypeID('fontCaps')
idMap['baseline'] = stringIDToTypeID('baseline')
idMap['strikethrough'] = stringIDToTypeID('strikethrough')
idMap['underline'] = stringIDToTypeID('underline')
idMap['color'] = stringIDToTypeID('color')
idMap['red'] = stringIDToTypeID('red')
idMap['green'] = stringIDToTypeID('green')
idMap['blue'] = stringIDToTypeID('blue')
idMap['paragraphStyleRange'] = stringIDToTypeID('paragraphStyleRange')
idMap['paragraphStyle'] = stringIDToTypeID('paragraphStyle')
idMap['align'] = stringIDToTypeID('align')
idMap['hyphenate'] = stringIDToTypeID('hyphenate')
idMap['firstLineIndent'] = stringIDToTypeID('firstLineIndent')
idMap['startIndent'] = stringIDToTypeID('startIndent')
idMap['endIndent'] = stringIDToTypeID('endIndent')
idMap['spaceBefore'] = stringIDToTypeID('spaceBefore')
idMap['spaceAfter'] = stringIDToTypeID('spaceAfter')

function getLayerData(doc, layer) {
  var layerData = {
    id: layer.id,
    name: layer.name,
    kind: layer.kind.toString(),
    bounds: [layer.bounds[0].as('px'), layer.bounds[1].as('px'), layer.bounds[2].as('px'), layer.bounds[3].as('px')],
    opacity: layer.opacity,
    isVisible: layer.visible,
    index: layer.itemIndex,
    isSelected: doc.activeLayer == layer
  }

  if (layerData.kind === 'LayerKind.TEXT') {
    var textKey = getLayerAttr(layer, idMap['textKey']).getObjectValue(idMap['textKey'])
    layerData.textContent = textKey.getString(idMap['textKey'])
    layerData.textStyles = textStyleRangeToArray(textKey.getList(idMap['textStyleRange']))
    layerData.paragraphStyles = paragraphStyleRangeToArray(textKey.getList(idMap['paragraphStyleRange']))
  } else if (layerData.kind === 'LayerKind.SOLIDFILL') {
    layerData.fillColor = getFillLayerColor(layer)
  }

  return layerData
}

function getLayerAttr(layer, key) {
  var ref = new ActionReference()
  ref.putProperty(app.charIDToTypeID('Prpr'), key)
  ref.putIndex(app.charIDToTypeID('Lyr '), layer.itemIndex)
  return executeActionGet(ref)
}

function textStyleRangeToArray(textStyleRange) {
  var styleRange, textStyle, textStyles = []

  for (var i = 0, l = textStyleRange.count; i < l; i++) {
    styleRange = textStyleRange.getObjectValue(i)
    textStyle = styleRange.getObjectValue(idMap['textStyle'])
    textStyles.push({
      from: styleRange.getInteger(idMap['from']),
      to: styleRange.getInteger(idMap['to']),
      fontPostScriptName: textStyle.getString(idMap['fontPostScriptName']),
      fontName: textStyle.getString(idMap['fontName']),
      size: textStyle.getDouble(idMap['size']),
      horizontalScale: textStyle.getInteger(idMap['horizontalScale']),
      verticalScale: textStyle.getInteger(idMap['verticalScale']),
      syntheticBold: Boolean(textStyle.getBoolean(idMap['syntheticBold'])),
      syntheticItalic: Boolean(textStyle.getBoolean(idMap['syntheticItalic'])),
      autoLeading: Boolean(textStyle.getBoolean(idMap['autoLeading'])),
      leading: textStyle.getInteger(idMap['leading']),
      tracking: textStyle.getInteger(idMap['tracking']),
      baselineShift: textStyle.getInteger(idMap['baselineShift']),
      autoKern: enumMap[textStyle.getEnumerationValue(idMap['autoKern'])],
      fontCaps: enumMap[textStyle.getEnumerationValue(idMap['fontCaps'])],
      baseline: enumMap[textStyle.getEnumerationValue(idMap['baseline'])],
      strikethrough: enumMap[textStyle.getEnumerationValue(idMap['strikethrough'])],
      underline: enumMap[textStyle.getEnumerationValue(idMap['underline'])],
      color: colorDescriptorToHexColor(textStyle.getObjectValue(idMap['color']))
    })
  }

  return textStyles
}

function paragraphStyleRangeToArray(paragraphStyleRange) {
  var paragraphRange, paragraphStyle, paragraphStyles = []

  for (var i = 0, l = paragraphStyleRange.count; i < l; i++) {
    paragraphRange = paragraphStyleRange.getObjectValue(i)
    paragraphStyle = paragraphRange.getObjectValue(idMap['paragraphStyle'])
    paragraphStyles.push({
      from: paragraphRange.getInteger(idMap['from']),
      to: paragraphRange.getInteger(idMap['to']),
      align: enumMap[paragraphStyle.getEnumerationValue(idMap['align'])],
      hyphenate: Boolean(paragraphStyle.getBoolean(idMap['hyphenate'])),
      firstLineIndent: paragraphStyle.getInteger(idMap['firstLineIndent']),
      startIndent: paragraphStyle.getInteger(idMap['startIndent']),
      endIndent: paragraphStyle.getInteger(idMap['endIndent']),
      spaceBefore: paragraphStyle.getInteger(idMap['spaceBefore']),
      spaceAfter: paragraphStyle.getInteger(idMap['spaceAfter'])
    })
  }

  return paragraphStyles
}

function getFillLayerColor(layer) {
  var key = app.charIDToTypeID('Adjs')
  var layerDesc = getLayerAttr(layer, key)
  var adjDesc = layerDesc.getList(key).getObjectValue(0)
  var clrDesc = adjDesc.getObjectValue(app.charIDToTypeID('Clr '))

  var color = new SolidColor()
  color.rgb.red = clrDesc.getDouble(app.charIDToTypeID('Rd  '))
  color.rgb.green = clrDesc.getDouble(app.charIDToTypeID('Grn '))
  color.rgb.blue = clrDesc.getDouble(app.charIDToTypeID('Bl  '))

  return color.rgb.hexValue
}

function colorDescriptorToHexColor(colorDescriptor) {
  var color = new SolidColor()
  color.rgb.red = colorDescriptor.getInteger(idMap['red'])
  color.rgb.green = colorDescriptor.getInteger(idMap['green'])
  color.rgb.blue = colorDescriptor.getInteger(idMap['blue'])
  return '#' + color.rgb.hexValue
}