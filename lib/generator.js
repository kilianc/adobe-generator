var statSync = require('fs').statSync,
    readdirSync = require('fs').readdirSync,
    resolve = require('path').resolve,
    EventEmitter = require('events').EventEmitter,
    photoshop = require('./photoshop')

var Generator = module.exports = function Generator(app, sio) {
  if (!(this instanceof Generator)) return new Generator(app, sio)
}

Generator.prototype.__proto__ = EventEmitter.prototype

Generator.prototype.connect = function connect(host, port, password, timeout, callback) {
  var self = this

  self.photoshop && self.photoshop.destroy()
  self.photoshop = photoshop()

  self.photoshop.on('error', function onPSError(err) {
    self.emit('error', err)
  })

  self.photoshop.connect(host, port, password, timeout, function onPhotoshopConnect() {
    self.photoshop.subscribe(['imageChanged', 'currentDocumentChanged', 'save'])
    callback()
  })
}

Generator.prototype.loadPlugins = function load(enabled, disabled) {
  var self = this
  var plugins = this.getPluginsList()

  enabled = enabled || Object.keys(plugins)
  enabled = enabled.filter(function (plugin) {
    return !~disabled.indexOf(plugin.replace('.generate', ''))
  })

  // executing plugins
  enabled.forEach(function (plugin) {
    require(plugins[plugin])(self.photoshop)
  })

  return enabled
}

Generator.prototype.getPluginsList = function getPluginsList() {
  var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
  var plugins = {}
  var paths = [
    resolve(__filename, '../', 'plugins'),
    resolve(home, '.generator', 'plugins')
  ]

  paths.forEach(function (path) {
    try {
      if(!statSync(path).isDirectory()) return

      readdirSync(path).forEach(function (pluginName) {
        if(!statSync(resolve(path, pluginName)).isDirectory()) return
        plugins[pluginName.replace('.generate', '')] = resolve(path, pluginName)
      })
    } catch (e) {}
  })

  return plugins
}

Generator.prototype.close = function close() {
  this.photoshop && this.photoshop.destroy()
  this.photoshopData = {}
}