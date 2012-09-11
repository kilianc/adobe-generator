module.exports = function cocoa(keepAliveDelay) {
  var buffer = ''

  // inbound
  process.stdin.setEncoding('utf8')
  process.stdin.resume()
  process.stdin.on('data', function (data) {
    buffer += data
    if (~buffer.indexOf('\n')) {
      var messages = buffer.split('\n')
      for (var i = 0, l = messages.length-1; i < l; i++) {
        process.emit('cocoaMessage', JSON.parse(messages[i]))
      }
      buffer = messages[i]
    }
  })

  // outout
  process.cocoaSend = function cocoaSend(obj) {
    process.stdout.write(JSON.stringify(obj) + '\n')
  }

  // kill the process asap the ping stops
  keepAliveDelay = keepAliveDelay || 1500
  var killFn = process.kill.bind(process)
  var killTimeout = setTimeout(killFn, keepAliveDelay)

  process.stdin.on('data', function (data) {
    clearTimeout(killTimeout)
    killTimeout = setTimeout(killFn, keepAliveDelay)
  })
}