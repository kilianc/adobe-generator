var fs = require('fs')

module.exports.json = fs.readFileSync(__dirname + '/json3.js', 'utf8')
module.exports.getActiveDocumentPath = module.exports.json + fs.readFileSync(__dirname + '/getActiveDocumentPath.js', 'utf8')
module.exports.getActiveLayerData = fs.readFileSync(__dirname + '/getActiveLayerData.js', 'utf8')
module.exports.getLayerData = fs.readFileSync(__dirname + '/getLayerData.js', 'utf8')
module.exports.getLayersData = module.exports.json + module.exports.getLayerData + fs.readFileSync(__dirname + '/getLayersData.js', 'utf8')
module.exports.getFontList = module.exports.json + fs.readFileSync(__dirname + '/getFontList.js', 'utf8')
module.exports.isScriptingSupportUpdated = module.exports.json + fs.readFileSync(__dirname + '/isScriptingSupportUpdated.js', 'utf8')