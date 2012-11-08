var net = require('net'),
    EventEmitter = require('events').EventEmitter,
    crypto = require('crypto'),
    util = require('util'),
    bufferjoiner = require('bufferjoiner')

var SALT = 'Adobe Photoshop'
var NUM_ITERATIONS = 1000
var ALGORITHM = 'des-ede3-cbc'
var KEY_LENGTH = 24
var HEADER_LENGTH = 8
var PROTOCOL_VERSION = 1
var IV = new Buffer('000000005d260000', 'hex') // 0000 0000 5d26 0000
var TRY_CATCH_TPL = 'try {\n[JS_CODE]\n} catch(e) { "Error:" + e.message }'

var Photoshop = module.exports = function Photoshop() {
  if (!(this instanceof Photoshop)) {
    return new Photoshop()
  }

  this.messageId = 0
  this.incomingMessage = null
  this.incomingBuffer = bufferjoiner()
  this.incomingPixmap = null
  this.commandsQueue = []
  this.currentCommand = null
  this.commandQueueStatus = 'waiting'
  this.writeQueue = []
  this.writeQueueStatus = 'waiting'
  this.subscriptions = {}
  this.pubSubEvents = []

  this.readMessageLength = this.readMessageLength.bind(this)
  this.fillPayload = this.fillPayload.bind(this)
}

Photoshop.prototype.__proto__ = EventEmitter.prototype

Photoshop.TYPE_JAVASCRIPT = 2
Photoshop.TYPE_PIXMAP = 3
Photoshop.NO_COMM_ERROR = 0

Photoshop.prototype.connect = function (host, port, password, timeout, callback) {
  var self = this

  self.connectionTimeout = setTimeout(function onPSConnectionTimeout() {
    var err = new Error('Connection timedout')
    err.code = 'ECONNTIMEOUT'
    self.emit('error', err)
  }, timeout)

  crypto.pbkdf2(password, SALT, NUM_ITERATIONS, KEY_LENGTH, function (err, derivedKey) {
    self.derivedKey = derivedKey

    self.socket = net.createConnection(port, host, function () {
      self.writeQueueStatus = 'ready'
      self.commandQueueStatus = 'ready'
      checkPassword(self, callback)
      self.deQueueCommand()
    })

    self.socket.setNoDelay()

    self.socket.once('data', self.readMessageLength.bind(self))

    self.socket.on('drain', function () {
      self.writeQueueStatus = 'ready'
      self.deQueueWrite()
    })

    self.socket.on('error', function onSocketError(err) {
      if (err.code === 'ECONNREFUSED') {
        clearTimeout(self.connectionTimeout)
        callback && callback(err)
        callback = undefined
      }
      self.emit('error', err)
    })

    self.socket.on('close', function (hadError) {
      self.emit('close', hadError)
    })
  })
}

function checkPassword(self, callback) {
  self.execute('"THE_PASSWORD_IS_RIGHT"', function (err, response) {
    clearTimeout(self.connectionTimeout)
    if (response.body !== 'THE_PASSWORD_IS_RIGHT') {
      err = new Error(response.body)
      err.code = 'ECONNRESET'
      self.emit('error', err)
    } else {
      callback & callback()
    }
  }, true)
}

Photoshop.prototype.enQueueCommand = function (javascript, callback, top) {
  javascript = TRY_CATCH_TPL.replace(/\[JS_CODE\]/, javascript)

  var body = this.encrypt(this.createMessage(javascript))
  var header = new Buffer(8)

  header.writeUInt32BE(body.length + 4, 0)
  header.writeUInt32BE(Photoshop.NO_COMM_ERROR, 4)

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

Photoshop.prototype.execute = Photoshop.prototype.enQueueCommand

Photoshop.prototype.subscribe = function (eventsId, callback) {
  // normalize to array
  if (typeof eventsId === 'string') eventsId = [eventsId]

  var self = this
  var script = []

  eventsId.forEach(function (eventId) {
    // disable multiple subscribe
    if (~self.pubSubEvents.indexOf(eventId)) return

    self.pubSubEvents.push(eventId)

    script.push('var actionDescriptor = new ActionDescriptor()')
    script.push('actionDescriptor.putClass(stringIDToTypeID(\'eventIDAttr\'), stringIDToTypeID(\'' + eventId + '\'))')
    script.push('executeAction(stringIDToTypeID(\'networkEventSubscribe\'), actionDescriptor, DialogModes.NO)')
  })

  script = script.join('\n')

  this.execute(script, callback)

  return this
}

Photoshop.prototype.deQueueCommand = function () {
  if ('ready' === this.commandQueueStatus && this.commandsQueue.length) {
    this.commandQueueStatus = 'waiting'
    this.currentCommand = this.commandsQueue.shift()
    this.enQueueWrite(this.currentCommand.header)
    this.enQueueWrite(this.currentCommand.body)
  }
}

Photoshop.prototype.polling = function polling(action, time, callback) {
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

      if (response.body === lastResult) return

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

Photoshop.prototype.enQueueWrite = function (chunk) {
  this.writeQueue.push(chunk)
  this.deQueueWrite()
}

Photoshop.prototype.deQueueWrite = function () {
  if ('ready' === this.writeQueueStatus && this.writeQueue.length) {
    this.writeQueueStatus = 'waiting'
    this.socket.write(this.writeQueue.shift())
  }
}

Photoshop.prototype.createMessage = function (javascript) {
  var buffer = new Buffer(javascript, 'utf8')
  var body = new Buffer(buffer.length + 4*3)

  body.writeUInt32BE(PROTOCOL_VERSION, 0)
  body.writeUInt32BE(this.getMessageId(), 4)
  body.writeUInt32BE(Photoshop.TYPE_JAVASCRIPT, 8)
  buffer.copy(body, 12)

  return body
}

Photoshop.prototype.getMessageId = function () {
  return this.messageId = (this.messageId + 1) % 127
}

Photoshop.prototype.encrypt = function (data) {
  var cipher = crypto.createCipheriv(ALGORITHM, this.derivedKey, IV)
  return new Buffer(cipher.update(data) + cipher.final(), 'binary')
}

Photoshop.prototype.readMessageLength = function (chunk) {
  this.incomingBuffer.add(chunk)

  if (this.incomingBuffer.length < HEADER_LENGTH) {
    return this.socket.once('data', this.readMessageLength)
  }

  var header = this.incomingBuffer.join()

  this.incomingMessage = {
    length: header.readUInt32BE(0) - 4,
    commStatus: header.readInt32BE(4)
  }

  this.fillPayload(header.slice(HEADER_LENGTH))
}

Photoshop.prototype.fillPayload = function (chunk) {
  this.incomingBuffer.add(chunk)

  var incomingBufferLength = this.incomingBuffer.length
  var incomingMessageLength = this.incomingMessage.length
  var missingLength = incomingMessageLength - incomingBufferLength

  if (missingLength <= 0) {
    var buffer = this.incomingBuffer.join().slice(0, incomingMessageLength)

    // decrypt only if there isn't any communication error from ps
    if (Photoshop.NO_COMM_ERROR === this.incomingMessage.commStatus) {
      buffer = this.decrypt(buffer)
    }

    this.incomingMessage.apiVersion = buffer.readUInt32BE(0)
    this.incomingMessage.messageId = buffer.readUInt32BE(4)
    this.incomingMessage.messageType = buffer.readUInt32BE(8)
    this.incomingMessage.buffer = buffer.slice(12)

    if (Photoshop.TYPE_PIXMAP === this.incomingMessage.messageType) {
      this.incomingPixmap = this.incomingMessage
    } else {
      this.incomingMessage.body = this.incomingMessage.buffer.toString('utf8')
      dispatchMessage(this)
    }

    this.readMessageLength(chunk.slice(chunk.length + missingLength))
  } else {
    this.socket.once('data', this.fillPayload)
  }
}

function dispatchMessage(self) {
  if (Photoshop.NO_COMM_ERROR !== self.incomingMessage.commStatus || /^Error:/.test(self.incomingMessage.body)) {
    var err = new Error()
    err.name = 'PhotoshopError'
    err.message = self.incomingMessage.body.slice(6)
  }

  var parts = self.incomingMessage.body.split('\r')
  var subscriptionType = parts.shift()

  if (subscriptionType && ~self.pubSubEvents.indexOf(subscriptionType)) {
    self.emit(subscriptionType, err, self.parseSubscriptionData(subscriptionType, parts))
  } else {
    self.currentCommand.callback && self.currentCommand.callback(err, self.incomingMessage, self.incomingPixmap)
    self.incomingPixmap = null
    self.writeQueueStatus = 'ready'
    self.commandQueueStatus = 'ready'
    self.deQueueCommand()
  }
}

Photoshop.prototype.parseSubscriptionData = function parseSubscriptionData(subscriptionType, parts) {
  var target = parts.shift().split(',').map(Number)
  var data = { documentId: target[0], layerId: target[1] }

  if ('layerChangedPosition' === subscriptionType) {
    var bounds = parts.shift().split(';')
    data.boundsNoEffects = bounds[1].split(',').map(Number)
    data.bounds = bounds[1].split(',').map(Number)
    return data
  }

  if ('layerChangedVisibility' === subscriptionType) {
    data.visibility = 'true' === parts.shift()
    return data
  }

  if ('layerChangedName' === subscriptionType) {
    data.name = parts.shift()
    return data
  }

  if ('layerChangedBlendMode' === subscriptionType) {
    data.blendMode = parts.shift()
    return data
  }

  if ('layerChangedOpacity' === subscriptionType) {
    data.opacity = (Number(parts.shift()) / 255).toFixed(2)
    return data
  }

  if ('imageChangedLayerOrder' === subscriptionType) {
    data.layersOrder = parts.shift().split(',').map(Number)
    return data
  }

  if ('imageChangedGlobalLight' === subscriptionType) {
    var globalLight = parts.shift().split(',').map(Number)
    data.globalLight = {
      angle: globalLight[0],
      altitude: globalLight[1]
    }
    return data
  }

  if ('imageChangedSize' === subscriptionType) {
    var documentBounds = parts.shift().split(',').map(Number)
    data.globalLight = {
      width: documentBounds[3],
      height: documentBounds[2]
    }
    return data
  }

  // we forgot to map some event
  // TODO: delete this at some point
  if (parts.length) throw new Error('forgot to map "' + subscriptionType + '": ' + parts.join('\n'))

  return data
}

Photoshop.prototype.decrypt = function (data) {
  var decipher = crypto.createDecipheriv(ALGORITHM, this.derivedKey, IV)
  return new Buffer(decipher.update(data) + decipher.final(), 'binary')
}

Photoshop.prototype.close = function () {
  this.socket.apply(this, arguments)
}

Photoshop.prototype.destroy = function () {
  this.removeAllListeners()
  this.socket && this.socket.destroy()
}