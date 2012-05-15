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
    layers.forEach(configureLayer)
  })

  socket.on('layerPngReady', function (layerId) {
    elements[layerId].to({
      'background-color': 'transparent',
      'background-image': 'url("images/layers/' + layers[layerId].name + '")'
    }).to({ opacity: 1 }, 1)
  })

  socket.emit('ready')

  function isFormatChanged(layer) {
    var element = elements[layer.id]
    var className = layer.kind.replace('LayerKind.').toLowerCase()
    return (element !== undefined && !element.hasClass(className))
  }

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

  function configureLayer(layer) {
    var element = elements[layer.id]

    if (element === undefined) {
      elements[layer.id] = createLayer(layer).appendTo(canvasElement)
    } else {
      element.css(getStyle(layer))
      if (layer.kind === 'LayerKind.TEXT') {
        element.text(layer.textContent)
      }
    }

    layers[layer.id] = layer

    if (layer.isSelected) {
      selectedLayer = layer
    }
  }

  function createLayer(layer) {
    var element
    var styles = getStyle(layer)
    switch (layer.kind) {
      case 'LayerKind.TEXT':
        element = $('<p id="ml-' + layer.id + '" class="text">' + layer.textContent + '</p>').css(styles)
        break
      case 'LayerKind.SOLIDFILL':
        element = $('<div id="ml-' + layer.id + '" class="solidfill"></div>').css(styles)
        break
      case 'LayerKind.NORMAL':
        element = $('<div id="ml-' + layer.id + '" class="normal"></div>').css(styles)
        break
    }
    element.css('position', 'absolute')
    element.draggable().on('dragstop', function (e, data) {
      var x = data.position.left - data.originalPosition.left
      var y = data.position.top - data.originalPosition.top
      socket.emit('move', layer.id, x, y)
    })
    return element
  }

  function getStyle(layer) {
    var styles = {
      'left': layer.bounds[0] + 'px',
      'top': layer.bounds[1] + 'px',
      'width': (layer.bounds[2] - layer.bounds[0])  + 'px',
      'height': (layer.bounds[3] - layer.bounds[1])  + 'px',
      'display': layer.isVisible ? 'block' : 'none',
      'z-index': layer.index
    }

    switch (layer.kind) {
      case 'LayerKind.TEXT':
        styles.color = '#' + layer.textColor
        styles['font-family'] = layer.textFont
        styles['font-size'] = layer.textSize
      break
      case 'LayerKind.SOLIDFILL':
        styles['background-color'] = '#' + layer.fillColor
      break
      case 'LayerKind.NORMAL':
        styles.opacity = 1
        styles['background-color'] = 'transparent'
        styles['background-image'] = 'url("images/layers/' + layer.name + '")'
      break
    }

    return styles
  }
})