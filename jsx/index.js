var fs = require('fs'),
    sid2tid = require('../lib/sid2tid-map.json')

var json = loadJSX('vendor/json3')
var es5shim = loadJSX('vendor/es5-sham') + loadJSX('vendor/es5-shim')
var enumMap = loadJSX('enum-map')
var sid2tidKeys = Object.keys(sid2tid)

function loadJSX(name) {
  var regexp
  var script = fs.readFileSync(__dirname + '/' + name + '.js', 'utf8')

  sid2tidKeys.forEach(function (stringId) {
    regexp = new RegExp('{sid2tid\\.' + stringId + '}', 'g')
    script = script.replace(regexp, sid2tid[stringId])
  })

  return script
}

// exports
var getLayerData = loadJSX('getLayerData')
module.exports.getLayerData = function (layerId) {
  return getLayerData + ';getLayerData(' + layerId + ')'
}

var getLayerPixmap = loadJSX('getLayerPixmap')
module.exports.getLayerPixmap = function (layerId, options) {
  return getLayerPixmap + ';getLayerPixmap(' + layerId + ')'
}

var isScriptingSupportUpdated = loadJSX('isScriptingSupportUpdated')
module.exports.isScriptingSupportUpdated = function (minDate) {
  return json + es5shim + isScriptingSupportUpdated + ';isScriptingSupportUpdated("' + minDate + '")'
}

var getActiveDocumentPath = loadJSX('getActiveDocumentPath')
module.exports.getActiveDocumentPath = function (documentId) {
  return json + es5shim + getActiveDocumentPath + ';getActiveDocumentPath(' + documentId + ')'
}

var getLayersData = loadJSX('getLayersData')
module.exports.getLayersData = function (documentId) {
  return json + es5shim + getLayerData + getLayersData + ';getLayersData(' + documentId + ')'
}

// cleanup memory
sid2tid = undefined
sid2tidKeys = undefined