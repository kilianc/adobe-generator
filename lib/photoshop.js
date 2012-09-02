var net = require('net'),
    EventEmitter = require('events').EventEmitter,
    crypto = require('crypto'),
    util = require('util'),
    BufferJoiner = require('bufferjoiner')

var SALT = 'Adobe Photoshop'
var NUM_ITERATIONS = 1000
var ALGORITHM = 'des-ede3-cbc'
var KEY_LENGTH = 24
var PROTOCOL_VERSION = 1
var JAVASCRIPT_TYPE = 2
var NO_COMM_ERROR = 0
var IV = new Buffer('000000005d260000', 'hex') // 0000 0000 5d26 0000

var events = [
  'foregroundColorChanged',
  'backgroundColorChanged',
  'toolChanged',
  'closedDocument',
  'newDocumentViewCreated',
  'currentDocumentChanged',
  'documentChanged',
  'activeViewChanged',
  'colorSettingsChanged',
  'keyboardShortcutsChanged',
  'preferencesChanged',
  'quickMaskStateChanged',
  'screenModeChanged'
]

var PhotoShop = module.exports = function PhotoShop() {
  if (!(this instanceof PhotoShop)) {
    return new PhotoShop()
  }

  PhotoShop.super_.call(this)

  this.messageId = 0
  this.incomingMessage = null
  this.commandsQueue = []
  this.currentCommand = null
  this.commandQueueStatus = 'wait'
  this.writeQueue = []
  this.writeQueueStatus = 'wait'
  this.subscriptions = {}
}

util.inherits(module.exports, EventEmitter)

PhotoShop.prototype.log = false

PhotoShop.prototype.connect = function (host, port, password, callback) {
  var self = this

  self.lastConnectionParams = {
    host: host,
    port: port
  }

  crypto.pbkdf2(password, SALT, NUM_ITERATIONS, KEY_LENGTH, function (err, derivedKey) {
    self.derivedKey = derivedKey
    callback && callback()
  })

  self.createSocket()
}

PhotoShop.prototype.createSocket = function () {
  var self = this

  if (self.socket !== undefined) {
    self.socket.end()
    self.socket.destroy()
  }

  self.socket = net.createConnection(self.lastConnectionParams.port, self.lastConnectionParams.host, function () {
    self.emit('connect')
    self.writeQueueStatus = 'ready'
    self.commandQueueStatus = 'ready'
    self.deQueueCommand()
  })

  self.socket.setNoDelay()
  self.socket.once('data', self.readMessageLength.bind(self))

  self.socket.on('drain', function () {
    self.writeQueueStatus = 'ready'
    self.deQueueWrite()
  })

  ;['end','err','timeout','close'].forEach(function (event) {
    self.socket.on(event, function () {
      self.log && console.log('  • %s', event)
    })
  })
}

PhotoShop.prototype.enQueueCommand = function (javascript, callback, top) {
  var body = this.encrypt(this.createMessage(javascript + '\n'))
  var header = new Buffer(8)

  header.writeUInt32BE(body.length + 4, 0)
  header.writeUInt32BE(NO_COMM_ERROR, 4)

  if (top) {
    this.commandsQueue.unshift({
      javascript: javascript,
      header: header,
      body: body,
      callback: callback
    })
  } else {
    this.commandsQueue.push({
      javascript: javascript,
      header: header,
      body: body,
      callback: callback
    })
  }

  this.deQueueCommand()
}

PhotoShop.prototype.execute = PhotoShop.prototype.enQueueCommand

PhotoShop.prototype.subscribe = function (eventId, callback) {
  this.subscriptionId ++
  var script = []
  script.push('actionDescriptor = new ActionDescriptor()')
  script.push('actionDescriptor.putClass(stringIDToTypeID(\'eventIDAttr\'), stringIDToTypeID(\'' + eventId + '\'))')
  script.push('executeAction(stringIDToTypeID(\'networkEventSubscribe\'), actionDescriptor, DialogModes.NO)')
  script.push('\'' + eventId + 'SubscribeSuccess\'')
  script = script.join('\n')

  this.execute(script, callback)

  return this
}

PhotoShop.prototype.deQueueCommand = function () {
  if (this.commandQueueStatus === 'ready' && this.commandsQueue.length) {
    this.commandQueueStatus = 'waiting'
    this.currentCommand = this.commandsQueue.shift()
    this.enQueueWrite(this.currentCommand.header)
    this.enQueueWrite(this.currentCommand.body)
    this.log && console.log(' -> ', this.currentCommand)
  }
}

PhotoShop.prototype.polling = function polling(action, time, callback) {
  var self = this
  var lastResult
  var pollingFn = function pollingFn() {
    self.execute(action, function (err, response) {
      setTimeout(pollingFn, time)
      if (err) {
        lastResult = null
        callback && callback(err)
        return
      }
      if (response.body === lastResult) {
        return
      }
      lastResult = response.body
      try {
        response.body = JSON.parse(response.body)
      } catch (err) {
        callback && callback(new Error('Parsing Error'), response.body)
        return
      }
      callback && callback(null, response.body)
    })
  }
  pollingFn()
}

PhotoShop.prototype.enQueueWrite = function (chunk) {
  this.writeQueue.push(chunk)
  this.deQueueWrite()
}

PhotoShop.prototype.deQueueWrite = function () {
  if (this.writeQueueStatus === 'ready' && this.writeQueue.length) {
    this.writeQueueStatus = 'wait'
    this.socket.write(this.writeQueue.shift())
  }
}

PhotoShop.prototype.createMessage = function (javascript) {
  var buffer = new Buffer(javascript, 'utf8')
  var body = new Buffer(buffer.length + 4*3)

  body.writeUInt32BE(PROTOCOL_VERSION, 0)
  body.writeUInt32BE(this.getMessageId(), 4)
  body.writeUInt32BE(JAVASCRIPT_TYPE, 8)
  buffer.copy(body, 12)

  return body
}

PhotoShop.prototype.getMessageId = function () {
  return this.messageId = (this.messageId + 1) % 127
}

PhotoShop.prototype.encrypt = function (data) {
  var cipher = crypto.createCipheriv(ALGORITHM, this.derivedKey, IV)
  data  = cipher.update(data.toString('utf8'), 'utf8', 'hex')
  data += cipher.final('hex')
  return new Buffer(data, 'hex')
}

PhotoShop.prototype.readMessageLength = function (chunk) {
  this.incomingMessage = {
    length: chunk.readUInt32BE(0) - 4,
    commStatus: chunk.readUInt32BE(4),
    buffer: new BufferJoiner()
  }
  this.fillPayload(chunk.slice(8))
}

PhotoShop.prototype.fillPayload = function (chunk) {
  this.incomingMessage.buffer.add(chunk)

  if (this.incomingMessage.buffer.length >= this.incomingMessage.length) {
    if (this.incomingMessage.commStatus === 0) {
      this.incomingMessage.buffer = this.decrypt(this.incomingMessage.buffer.join())
    } else {
      this.incomingMessage.buffer = this.incomingMessage.buffer.join()
    }

    this.incomingMessage.apiVersion = this.incomingMessage.buffer.readUInt32BE(0)
    this.incomingMessage.transactionID = this.incomingMessage.buffer.readUInt32BE(0, 4)
    this.incomingMessage.messageType = this.incomingMessage.buffer.readUInt32BE(0, 8)
    this.incomingMessage.body = this.incomingMessage.buffer.slice(12).toString('utf8')

    if (dispatchMessage(this)) {
      this.log && console.log(
        ' <- [%d:%d] %s',
        this.incomingMessage.commStatus,
        this.incomingMessage.messageType,
        this.incomingMessage.body
      )

      this.socket.once('data', this.readMessageLength.bind(this))
      this.writeQueueStatus = 'ready'
      this.commandQueueStatus = 'ready'
      this.deQueueCommand()
    }
  } else {
    this.socket.once('data', this.fillPayload.bind(this))
  }
}

function dispatchMessage(self) {
  var err = null
  var parts = self.incomingMessage.body.split('\r')
  var subscriptionType = parts[0]

  if (self.incomingMessage.commStatus === 2) {
    err = new Error(self.incomingMessage.body)
    if ('Error handling network message' === err.message) {
      reconnect.call(self, err, 2000)
      return false
    }
  }

  if (~events.indexOf(subscriptionType)) {
    self.emit(parts[0], err, parts[1])
  } else {
    self.currentCommand.callback && self.currentCommand.callback(err, self.incomingMessage)
  }

  return true
}

function reconnect(err, time) {
  this.emit('error', err)
  this.socket.end()
  this.socket.destroy()
  this.emit('reconnect')
  var self = this
  setTimeout(function () {
    self.createSocket.call(self)
  }, time)
}

PhotoShop.prototype.decrypt = function (data) {
  var decipher = crypto.createDecipheriv(ALGORITHM, this.derivedKey, IV)
  data  = decipher.update(data.toString('hex'), 'hex', 'utf8')
  data += decipher.final('utf8')
  return new Buffer(data, 'utf8')
}