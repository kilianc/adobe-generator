var fs = require('fs'),
    sid2tid = require('../sid2tid-map.json')

var es5shim = load('es5-sham') + load('es5-shim')
var json = load('json3')
var enumMap = load('enum-map')

module.exports.json = json
module.exports.getActiveDocumentPath = json + es5shim + load('getActiveDocumentPath')
module.exports.getLayerData = enumMap + load('getLayerData')
module.exports.getActiveLayerData = es5shim + module.exports.getLayerData + load('getActiveLayerData')
module.exports.getLayersData = json + es5shim + module.exports.getLayerData + load('getLayersData')
module.exports.getFontList = json + es5shim + load('getFontList')
module.exports.isScriptingSupportUpdated = json + es5shim + load('isScriptingSupportUpdated')

function load(name) {
  var regexp
  var script = fs.readFileSync(__dirname + '/' + name + '.js', 'utf8')

  Object.keys(sid2tid).forEach(function (stringId) {
    regexp = new RegExp('{sid2tid\\.' + stringId + '}', 'g')
    script = script.replace(regexp, sid2tid[stringId])
  })

  return script
}