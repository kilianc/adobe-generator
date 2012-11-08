module.exports = function freeport(callback) {
  // get a random available port
  net.createServer().once('close', function() {
    callback(this.availablePort)
  }).once('listening', function() {
    this.availablePort = this.address().port
    this.close()
  }).listen(0)
}