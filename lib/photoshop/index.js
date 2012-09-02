var fs = require('fs')

module.exports.json = fs.readFileSync('./lib/photoshop/json3.js', 'utf8')
module.exports.getActiveDocumentPath = module.exports.json + fs.readFileSync('./lib/photoshop/getActiveDocumentPath.js', 'utf8')
module.exports.getActiveLayerData = fs.readFileSync('./lib/photoshop/getActiveLayerData.js', 'utf8')
module.exports.getLayerData = fs.readFileSync('./lib/photoshop/getLayerData.js', 'utf8')
module.exports.getLayersData = module.exports.json + module.exports.getLayerData + fs.readFileSync('./lib/photoshop/getLayersData.js', 'utf8')
module.exports.getFontList = module.exports.json + fs.readFileSync('./lib/photoshop/getFontList.js', 'utf8')