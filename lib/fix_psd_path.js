var path = require('path')

module.exports = function fixPsdPath(psdPath) {
  psdPath = path.resolve(psdPath.replace('~', process.env.HOME))

  try { fs.statSync(psdPath) }
  catch (err) { psdPath = '/Volumes' + psdPath }

  return psdPath
}