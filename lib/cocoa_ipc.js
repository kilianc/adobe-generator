// keepalive

module.exports = function configureIPC(killDelay) {
  killDelay = killDelay || 1500
  var killFn = process.kill.bind(process)
  var killTimeout = setTimeout(killFn, killDelay)

  process.stdin.pipe(process.stdout)
  process.stdin.on('data', function () {
    clearTimeout(killTimeout)
    killTimeout = setTimeout(killFn, killDelay)
  })

  return module.exports
}

module.exports.send = function send(obj) {
  process.stdout.write(JSON.stringify(obj))
}