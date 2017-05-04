let Reconnect = require('../src/index.js')
let net = require('net')
let socket = new net.Socket()
let options = { 'host': process.argv[2], 'port': process.argv[3], 'retryAlways': true }
let NetKeepAlive = require('net-keepalive')

Reconnect.apply(socket, options)

socket.setKeepAlive(true, 1000)
socket.setTimeout(1000)

socket.connect(options)

let timeout
socket.on('connect', function () {
  NetKeepAlive.setKeepAliveInterval(socket, 1000)
  NetKeepAlive.setKeepAliveProbes(socket, 1)

  console.log('Unplug the network connection')
})

socket.on('close', function () {
  clearTimeout(timeout)
})

