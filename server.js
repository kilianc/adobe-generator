var http = require('http'),
    net = require('net'),
    fs = require('fs'),
    argv = require('commander'),
    Generator = require('./lib/generator')

argv
  .option('-p, --port <s>', 'The Photoshop server port')
  .option('-H, --host <s>', 'The Photoshop server host')
  .option('-P, --password <s>', 'The Photoshop server password')
  .parse(process.argv)

var generator = new Generator()

generator.connect(argv.host, argv.port, argv.password, 500, function (err) {
  if (err) throw err
  generator.load()
})

process.on('uncaughtException', function (err) {
  // Report remotely?
  console.error(err, err.stack)
  console.error('Killing generator')
  process.kill()
})