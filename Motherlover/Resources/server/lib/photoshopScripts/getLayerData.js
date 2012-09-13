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
idMap['transform'] = stringIDToTypeID('transform')
idMap['xx'] = stringIDToTypeID('xx')
idMap['xy'] = stringIDToTypeID('xy')
idMap['yx'] = stringIDToTypeID('yx')
idMap['yy'] = stringIDToTypeID('yy')
idMap['tx'] = stringIDToTypeID('tx')
idMap['ty'] = stringIDToTypeID('ty')
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

    if (layerData.textContent) {
      // expose matrix if exists
      if (textKey.hasKey(idMap['transform'])) {
        var transformDescriptor = textKey.getObjectValue(idMap['transform'])
        layerData.transform = {}
        ;['xx', 'xy', 'yx', 'yy', 'tx', 'ty'].forEach(function (entry) {
          layerData.transform[entry] = transformDescriptor.getDouble(idMap[entry])
        })
      } else {
        layerData.transform = false
      }
      // styles
      layerData.textStyles = textStyleRangeToArray(textKey.getList(idMap['textStyleRange']))
      layerData.paragraphStyles = paragraphStyleRangeToArray(textKey.getList(idMap['paragraphStyleRange']))
    }
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
      align: paragraphStyle.hasKey(idMap['align']) ? enumMap[paragraphStyle.getEnumerationValue(idMap['align'])] : 'left',
      hyphenate: paragraphStyle.hasKey(idMap['hyphenate']) ? Boolean(paragraphStyle.getBoolean(idMap['hyphenate'])) : true,
      firstLineIndent: paragraphStyle.hasKey(idMap['firstLineIndent']) ? paragraphStyle.getInteger(idMap['firstLineIndent']) : 0,
      startIndent: paragraphStyle.hasKey(idMap['startIndent']) ? paragraphStyle.getInteger(idMap['startIndent']) : 0,
      endIndent: paragraphStyle.hasKey(idMap['endIndent']) ? paragraphStyle.getInteger(idMap['endIndent']) : 0,
      spaceBefore: paragraphStyle.hasKey(idMap['spaceBefore']) ? paragraphStyle.getInteger(idMap['spaceBefore']) : 0,
      spaceAfter: paragraphStyle.hasKey(idMap['spaceAfter']) ? paragraphStyle.getInteger(idMap['spaceAfter']) : 0
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

function colorDescriptorToHexColor(colorDescriptor) {
  var color = new SolidColor()
  color.rgb.red = colorDescriptor.getInteger(idMap['red'])
  color.rgb.green = colorDescriptor.getInteger(idMap['green'])
  color.rgb.blue = colorDescriptor.getInteger(idMap['blue'])
  return '#' + color.rgb.hexValue
}

// ES5 15.4.4.18 Array.prototype.forEach ( callbackfn [ , thisArg ] )
// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fun /*, thisp */) {
    if (this === void 0 || this === null) { throw new TypeError(); }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") { throw new TypeError(); }

    var thisp = arguments[1], i;
    for (i = 0; i < len; i++) {
      if (i in t) {
        fun.call(thisp, t[i], i, t);
      }
    }
  };
}