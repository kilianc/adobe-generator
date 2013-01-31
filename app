#!bin/node

var http = require('http'),
    net = require('net'),
    fs = require('fs'),
    program = require('commander'),
    Generator = require('./lib/generator'),
    version = require('./package.json').version

program
  .version(version)
  .option('-p, --port <s>', 'the Photoshop server port', 49494)
  .option('-H, --host <s>', 'the Photoshop server host', 'localhost')
  .option('-P, --password <s>', 'the Photoshop server password', 'password')
  .option('-t, --timeout <ms>', 'time before timeout', 500)
  .option('-l, --list', 'lists installed plugins')
  .option('-u, --use \'<name> <name> ...\'', 'explicitly activate plugins')
  .option('-U, --nuse \'<name> <name> ...\'', 'explicitly disable plugins', '')
  .parse(process.argv)

var generator = new Generator()

if (program.list) {
  var plugins = generator.getPluginsList()

  console.log('\n  Installed plugins:\n')
  Object.keys(plugins).forEach(function (plugin) {
    console.log('  - %s: %s', plugin, plugins[plugin])
  })
  console.log()

  process.exit()
}

generator.connect(program.host, program.port, program.password, program.timeout, function (err) {
  if (err) throw err

  var enablePlugins = program.use ? program.use.split(' ') : false
  var disablePlugins = program.nuse ? program.nuse.split(' ') : []
  var activePlugins = generator.loadPlugins(enablePlugins, disablePlugins)

  console.log('\n - Correctly activated %d plugins: %j\n', activePlugins.length, activePlugins)
})

process.on('uncaughtException', function (err) {
  // Report remotely?
  console.error(err.stack)
  console.error({ name: 'error', data: { message: err.message, stack: err.stack, code: 'UNCAUGHT_EXCEPTION' } })
  process.kill()
})