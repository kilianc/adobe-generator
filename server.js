var http = require('http'),
    net = require('net'),
    fs = require('fs'),
    socketio = require('socket.io'),
    express = require('express'),
    cocoa = require('./lib/cocoa')(15000),
    motherlover = require('./lib/motherlover')

// PS connection

ml.use()


ml.on('error', function (err, response) {
  process.cocoaSend({ name: 'error', data: {
    message: err.message,
    stack: err.stack,
    response: response,
    code: err.code
  } })
})


// http server
var app = express()
var server = http.createServer(app)
var sio = socketio.listen(server, { log: false })
var ml = motherlover(app, sio)

// get a random available port
net.createServer().once('close', function() {
  server.listen(this.availablePort)
  process.cocoaSend({ name: 'httpPort', data: this.availablePort })
}).once('listening', function() {
  this.availablePort = this.address().port
  this.close()
}).listen(0)

process.on('cocoaMessage', function (message) {
  message.name !== 'ping' && process.cocoaSend({ name: 'back', message: message })
  switch (message.name) {
    case 'connect':
      ml.connect(message.host, message.port, message.password, 500, function (err) {
        if (!err) {
          process.cocoaSend({ name: 'connected' })
        } else {
          throw err
        }
      })
    break
    case 'disconnect':
      ml.close()
      process.cocoaSend({ name: 'disconnected' })
    break
  }
})

process.on('uncaughtException', function (err) {
  console.error(err, err.stack)
  process.cocoaSend({ name: 'error', data: { message: err.message, stack: err.stack, code: 'UNCAUGHT_EXCEPTION' } })
  process.kill()
})