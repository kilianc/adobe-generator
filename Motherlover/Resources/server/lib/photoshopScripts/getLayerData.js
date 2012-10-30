function getLayerData(doc, layer) {
  var layerBounds = layer.boundsNoEffects
  var layerData = {
    id: layer.id,
    name: layer.name,
    kind: layer.kind.toString(),
    bounds: [layerBounds[0].as('px'), layerBounds[1].as('px'), layerBounds[2].as('px'), layerBounds[3].as('px')],
    opacity: layer.opacity,
    isVisible: layer.visible,
    index: layer.itemIndex,
    isSelected: doc.activeLayer == layer,
    layerStyles: getLayerStyles(layer)
  }

  if (layerData.kind === 'LayerKind.TEXT') {
    var textKey = getLayerAttr(layer, {sid2tid.textKey}).getObjectValue({sid2tid.textKey})
    layerData.textContent = textKey.getString({sid2tid.textKey})

    if (layerData.textContent) {
      // expose matrix if exists
      if (textKey.hasKey({sid2tid.transform})) {
        var transformDescriptor = textKey.getObjectValue({sid2tid.transform})
        layerData.transform = {
          xx: transformDescriptor.getDouble({sid2tid.xx}),
          xy: transformDescriptor.getDouble({sid2tid.xy}),
          yx: transformDescriptor.getDouble({sid2tid.yx}),
          yy: transformDescriptor.getDouble({sid2tid.yy}),
          tx: transformDescriptor.getDouble({sid2tid.tx}),
          ty: transformDescriptor.getDouble({sid2tid.ty})
        }
      } else {
        layerData.transform = false
      }
      // styles
      layerData.textStyles = textStyleRangeToArray(textKey.getList({sid2tid.textStyleRange}))
      layerData.paragraphStyles = paragraphStyleRangeToArray(textKey.getList({sid2tid.paragraphStyleRange}))
    }
  } else if (layerData.kind === 'LayerKind.SOLIDFILL') {
    layerData.fillColor = getFillLayerColor(layer)
  }

  return layerData
}

getLayerData.globalAngle = getLayerAttr(app.activeDocument.activeLayer, {sid2tid.globalAngle}).getInteger({sid2tid.globalAngle})

function getLayerAttr(layer, key) {
  var ref = new ActionReference()
  ref.putProperty({sid2tid.Prpr}, key)
  ref.putIndex({sid2tid.Lyr_}, layer.itemIndex)
  return executeActionGet(ref)
}

function textStyleRangeToArray(textStyleRange) {
  var styleRange, textStyle, textStyles = []

  for (var i = 0, l = textStyleRange.count; i < l; i++) {
    styleRange = textStyleRange.getObjectValue(i)
    textStyle = styleRange.getObjectValue({sid2tid.textStyle})
    textStyles.push({
      from: styleRange.getInteger(idMap['from']),
      to: styleRange.getInteger(idMap['to']),
      fontPostScriptName: textStyle.getString(idMap['fontPostScriptName']),
      fontName: textStyle.getString(idMap['fontName']),
      size: Math.round(textStyle.getDouble(idMap['size'])),
      horizontalScale: textStyle.hasKey(idMap['horizontalScale']) ? Math.round(textStyle.getDouble(idMap['horizontalScale'])) : 0,
      verticalScale: textStyle.hasKey(idMap['verticalScale']) ? Math.round(textStyle.getDouble(idMap['verticalScale'])) : 0,
      syntheticBold: textStyle.hasKey(idMap['syntheticBold']) ? Boolean(textStyle.getBoolean(idMap['syntheticBold'])) : false,
      syntheticItalic: textStyle.hasKey(idMap['syntheticItalic']) ? Boolean(textStyle.getBoolean(idMap['syntheticItalic'])) : false,
      autoLeading: textStyle.hasKey(idMap['autoLeading']) ? Boolean(textStyle.getBoolean(idMap['autoLeading'])) : true,
      leading: textStyle.hasKey(idMap['leading']) ? textStyle.getInteger(idMap['leading']) : 'auto',
      tracking: textStyle.hasKey(idMap['tracking']) ? textStyle.getInteger(idMap['tracking']) : 0,
      baselineShift: textStyle.hasKey(idMap['baselineShift']) ? textStyle.getInteger(idMap['baselineShift']) : 0,
      autoKern: textStyle.hasKey(idMap['autoKern']) ? enumMap[textStyle.getEnumerationValue(idMap['autoKern'])] : 'metricsKern',
      fontCaps: textStyle.hasKey(idMap['fontCaps']) ? enumMap[textStyle.getEnumerationValue(idMap['fontCaps'])] : 'normal',
      baseline: textStyle.hasKey(idMap['baseline']) ? enumMap[textStyle.getEnumerationValue(idMap['baseline'])] : 'normal',
      strikethrough: textStyle.hasKey(idMap['strikethrough']) ? enumMap[textStyle.getEnumerationValue(idMap['strikethrough'])] : 'strikethroughOff',
      underline: textStyle.hasKey(idMap['underline']) ? enumMap[textStyle.getEnumerationValue(idMap['underline'])] : 'underlineOff',
      color: textStyle.hasKey(idMap['color']) ? colorDescriptorToHexColor(textStyle.getObjectValue(idMap['color'])) : '#000000'
    })
  }

  return textStyles
}

function paragraphStyleRangeToArray(paragraphStyleRange) {
  var paragraphRange, paragraphStyle, paragraphStyles = []

  for (var i = 0, l = paragraphStyleRange.count; i < l; i++) {
    paragraphRange = paragraphStyleRange.getObjectValue(i)
    paragraphStyle = paragraphRange.getObjectValue({sid2tid.paragraphStyle})
    paragraphStyles.push({
      from: paragraphRange.getInteger({sid2tid.from}),
      to: paragraphRange.getInteger({sid2tid.to}),
      align: paragraphStyle.hasKey({sid2tid.align}) ? enumMap[paragraphStyle.getEnumerationValue({sid2tid.align})] : 'left',
      hyphenate: paragraphStyle.hasKey({sid2tid.hyphenate}) ? Boolean(paragraphStyle.getBoolean({sid2tid.hyphenate})) : true,
      firstLineIndent: paragraphStyle.hasKey({sid2tid.firstLineIndent}) ? paragraphStyle.getInteger({sid2tid.firstLineIndent}) : 0,
      startIndent: paragraphStyle.hasKey({sid2tid.startIndent}) ? paragraphStyle.getInteger({sid2tid.startIndent}) : 0,
      endIndent: paragraphStyle.hasKey({sid2tid.endIndent}) ? paragraphStyle.getInteger({sid2tid.endIndent}) : 0,
      spaceBefore: paragraphStyle.hasKey({sid2tid.spaceBefore}) ? paragraphStyle.getInteger({sid2tid.spaceBefore}) : 0,
      spaceAfter: paragraphStyle.hasKey({sid2tid.spaceAfter}) ? paragraphStyle.getInteger({sid2tid.spaceAfter}) : 0
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

  return '#' + color.rgb.hexValue
}

function getLayerStyles(layer) {
  var layerEffects = getLayerAttr(layer, {sid2tid.layerEffects})
  var layerFXVisible = getLayerAttr(layer, {sid2tid.layerFXVisible}).getBoolean({sid2tid.layerFXVisible})

  if (!layerEffects.hasKey({sid2tid.layerEffects}) || !layerFXVisible) {
    return false
  }

  layerEffects = layerEffects.getObjectValue({sid2tid.layerEffects})

  return {
    dropShadow: getShadow(layerEffects, true),
    innerShadow: getShadow(layerEffects, false),
    outerGlow: getGlow(layerEffects, true),
    innerGlow: getGlow(layerEffects, false),
    stroke: getStroke(layerEffects)
  }
}

function getShadow(actionDescriptor, isOuter) {
  var key = isOuter ? {sid2tid.dropShadow} : {sid2tid.innerShadow}

  if (!actionDescriptor.hasKey(key)) {
    return false
  }

  var styleDescriptor = actionDescriptor.getObjectValue(key)

  if (!styleDescriptor.getBoolean({sid2tid.enabled})) {
    return false
  }

  return {
    color: colorDescriptorToHexColor(styleDescriptor.getObjectValue({sid2tid.color})),
    opacity: Math.round(styleDescriptor.getDouble({sid2tid.opacity})),
    useGlobalAngle: styleDescriptor.getInteger({sid2tid.useGlobalAngle}),
    localLightingAngle: styleDescriptor.getInteger({sid2tid.localLightingAngle}),
    globalAngle: getLayerData.globalAngle,
    distance: styleDescriptor.getInteger({sid2tid.distance}),
    chokeMatte: styleDescriptor.getInteger({sid2tid.chokeMatte}),
    size: styleDescriptor.getInteger({sid2tid.blur})
  }
}

function getGlow(actionDescriptor, isOuter) {
  var key = isOuter ? {sid2tid.outerGlow} : {sid2tid.innerGlow}

  if (!actionDescriptor.hasKey(key)) {
    return false
  }

  var styleDescriptor = actionDescriptor.getObjectValue(key)

  if (!styleDescriptor.getBoolean({sid2tid.enabled})) {
    return false
  }

  return {
    color: colorDescriptorToHexColor(styleDescriptor.getObjectValue({sid2tid.color})),
    opacity: Math.round(styleDescriptor.getDouble({sid2tid.opacity})),
    spread: styleDescriptor.getInteger({sid2tid.chokeMatte}),
    size: styleDescriptor.getInteger({sid2tid.blur})
  }
}

function getStroke(actionDescriptor) {
  if (!actionDescriptor.hasKey({sid2tid.frameFX})) {
    return false
  }

  var styleDescriptor = actionDescriptor.getObjectValue({sid2tid.frameFX})

  if (!styleDescriptor.getBoolean({sid2tid.enabled})) {
    return false
  }

  return {
    style: enumMap[styleDescriptor.getEnumerationValue({sid2tid.style})],
    size: styleDescriptor.getInteger({sid2tid.size}),
    color: colorDescriptorToHexColor(styleDescriptor.getObjectValue({sid2tid.color})),
    opacity: Math.round(styleDescriptor.getDouble({sid2tid.opacity}))
  }
}

function colorDescriptorToHexColor(colorDescriptor) {
  var color = new SolidColor()
  color.rgb.red = colorDescriptor.getInteger({sid2tid.red})
  color.rgb.green = colorDescriptor.getInteger({sid2tid.green})
  color.rgb.blue = colorDescriptor.getInteger({sid2tid.blue})
  return '#' + color.rgb.hexValue
}