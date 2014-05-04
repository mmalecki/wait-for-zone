'use strict';

var fs = require('fs')
  , path = require('path')
  , spawn = require('child_process').spawn
  , concatStream = require('concat-stream')

var CHECK_INTERVAL = 1000

module.exports = function(uuid, callback) {
  setInterval(function() {
    var succeeded = 0

    function checkDone(err, result) {
      if (err) return callback(err)
      if (result) ++succeeded
      if (succeeded === 2) return callback(null, uuid)
    }

    var child = spawn('vmadm', ['get', uuid])
    child.stdout.pipe(concatStream(function(data) {
      var parsed

      try {
        parsed = JSON.parse(data)
      }
      catch (ex) {
        return checkDone(ex)
      }

      checkDone(null, parsed.zone_state === 'running')
    }))


    fs.stat
      ( path.join('/zones', uuid, 'root', 'tmp', '.FIRST_REBOOT_NOT_COMPLETE_YET')
      , function(err, stat) {
          if (err && err.code !== 'ENOENT') return checkDone(err)
          checkDone(null, err.code !== 'ENOENT')
        }
      )

  }, CHECK_INTERVAL)
}
