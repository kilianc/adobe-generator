#!/usr/bin/env node
var http = require('http'),
    net = require('net'),
    fs = require('fs'),
    argv = require('commander'),
    Generator = require('./lib/generator')

argv
  .option('-p, --port <s>', 'The Photoshop server port', 49494)
  .option('-H, --host <s>', 'The Photoshop server host', 'localhost')
  .option('-P, --password <s>', 'The Photoshop server password', 'password')
  .parse(process.argv)

var generator = new Generator()

generator.connect(argv.host, argv.port, argv.password, 500, function (err) {
  if (err) throw err
  generator.load()
})

process.on('uncaughtException', function (err) {
  // Report remotely?
  console.error(err.stack)
  console.error({ name: 'error', data: { message: err.message, stack: err.stack, code: 'UNCAUGHT_EXCEPTION' } })
  process.kill()
})