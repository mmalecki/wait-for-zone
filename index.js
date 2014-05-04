'use strict';

var fs = require('fs')
  , path = require('path')
  , spawn = require('child_process').spawn
  , concatStream = require('concat-stream')

var CHECK_INTERVAL = 1000

module.exports = function(uuid, callback) {
  setTimeout(function() {
    var succeeded = 0

    function checkDone(result) {
      if (result) ++succeeded
      if (succeeded === 2) return callback(null, true)
    }

    var child = spawn('vmadm', ['get', uuid])
    child.stdout.pipe(concatStream(function(data) {
      var parsed

      try {
        parsed = JSON.parse(data)
      }
      catch (ex) {
        return callback(ex)
      }

      checkDone(parsed.zone_state === 'running')
    }))


    fs.stat
      ( path.join('/zones', uuid, 'root', 'tmp', '.FIRST_REBOOT_NOT_COMPLETE_YET')
      , function(err, stat) {
          if (err && err.code !== 'ENOENT') return callback(err)
          checkDone(err.code !== 'ENOENT')
        }
      )

  }, CHECK_INTERVAL)
}
