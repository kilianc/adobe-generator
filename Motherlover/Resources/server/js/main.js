/*global io loadTemplate async*/
$().ready(function () {
  "use strict";

  window.document.title = 'motherlover™'

  var elements = {}
  var layers = {}
  var layersArray = []
  var selectedLayer = null
  var socket = io.connect()
  var canvasElement = $('#canvas')

  socket.on('currentDocumentChanged', function (data) {
    window.document.title = 'motherlover™ / ' + data.split('/').pop()
    document.location.hash = data
  })

  socket.on('toolChanged', function (data) {})
  socket.on('fontList', function (fontList) {})

  socket.on('layers', function (layers) {
    purgeLayers(layers)
    layersArray = layers
    layers.forEach(function updateDOM(layer) {
      var element = updateLayerElement(elements[layer.id], layer)
      if (!element.parent().length) {
        elements[layer.id] = element.appendTo(canvasElement)
      }
      layers[layer.id] = layer
    })
  })

  socket.on('layerPngReady', function (layerId) {
    elements[layerId].to({
      'background-color': 'transparent',
      'background-image': 'url("images/layers/' + layers[layerId].name + '")'
    }).to({ opacity: 1 }, 1)
  })

  socket.emit('ready')

  function purgeLayers(newLayerSet) {
    var ids = newLayerSet.map(function (layer) { return layer.id })

    layersArray.forEach(function (layer) {
      var layerId = layer.id

      if (ids.indexOf(layerId) === -1 || isFormatChanged(layer)) {
        elements[layerId].remove()
        ;delete elements[layerId]
      }
    })
  }

  function isFormatChanged(layer) {
    var element = elements[layer.id]
    var className = layer.kind.replace('LayerKind.', '').toLowerCase()
    return (element !== undefined && !element.hasClass(className))
  }

  function updateLayerElement(element, layer) {
    var styles = {
      left: layer.bounds[0] + 'px',
      top: layer.bounds[1] + 'px',
      width: (layer.bounds[2] - layer.bounds[0])  + 'px',
      height: (layer.bounds[3] - layer.bounds[1])  + 'px',
      display: layer.isVisible ? 'block' : 'none',
      zIndex: layer.index,
      opacity: layer.opacity
    }

    switch (layer.kind) {
      case 'LayerKind.TEXT':
        element = element || $('<div id="ml-' + layer.id + '" class="text"></div>')
        element.empty().append(createParagraphs(layer))
        element.css(styles)
        break
      case 'LayerKind.SOLIDFILL':
        styles.backgroundColor = layer.fillColor
        element = element || $('<div id="ml-' + layer.id + '" class="solidfill"></div>')
        element.css(styles)
        break
      case 'LayerKind.NORMAL':
        styles.opacity = 1
        styles.backgroundColor = 'transparent'
        styles.backgroundImage = 'url("images/layers/' + layer.name + '")'
        element = element || $('<div id="ml-' + layer.id + '" class="normal"></div>')
        element.css(styles)
        break
    }

    return element
  }

  function createParagraphs(layer) {
    var textStyles = layer.textStyles.slice(0)
    var textContent = layer.textContent
    var paragraphs = layer.paragraphStyles.map(function (paragraphStyle) {
      var spans = createSpansForParagraphs(textStyles, paragraphStyle.from, paragraphStyle.to, textContent)
      var p = $('<p>').css({
        textAlign: paragraphStyle.align,
        webkitHyphens: 'auto'
      }).append(spans)

      return p[0]
    })

    return paragraphs
  }

  function createSpansForParagraphs(textStyles, from, to, textContent) {
    var textStyle, spanText, css, spans = []
    var stylesRanges = []

    for (var i = 0, l = textStyles.length; i < l; i++) {
      textStyle = textStyles[i]

      // hack related to https://github.com/kilianc/motherlover/issues/33
      if (stylesRanges.indexOf(textStyle.from + ':' + textStyle.to) !== -1) continue
      stylesRanges.push(textStyle.from + ':' + textStyle.to)

      if (textStyle.to < from) continue
      if (textStyle.from > to) break

      spanText = textContent.substring(Math.max(textStyle.from, from), Math.min(textStyle.to, to)).replace('\n', '<br>')

      css = {
        font: textStyle.size + 'px "' + textStyle.fontPostScriptName + '"',
        color: textStyle.color
      }

      if (textStyle.underline === 'underlineOnLeftInVertical') {
        css.textDecoration = 'underline'
      }
      if (textStyle.strikethrough === 'xHeightStrikethroughOn') {
        css.textDecoration = css.textDecoration ? css.textDecoration + ' line-through' : 'line-through'
      }
      if (textStyle.fontCaps === 'allCaps') {
        css.textTransform = 'uppercase'
      } else if (textStyle.fontCaps === 'smallCaps') {
        css.fontVariant = 'small-caps'
      }

      spans.push($('<span>').text(spanText).css(css)[0])
    }

    return spans
  }
})