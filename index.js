'use strict';

var fs = require('fs')
  , path = require('path')
  , spawn = require('child_process').spawn
  , concatStream = require('concat-stream')

var CHECK_INTERVAL = 1000

module.exports = function(uuid, callback) {
  var interval = setInterval(function() {
    var succeeded = 0

    function done(err, uuid) {
      clearInterval(interval)
      callback(err, uuid)
    }

    function checkDone(err, result) {
      if (err) return done(err)
      if (result) ++succeeded
      if (succeeded === 2) return done(null, uuid)
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
          if (err) {
            if (err.code === 'ENOENT') return checkDone(null, true)
            callback(err)
          }
          callback(null, false)
        }
      )

  }, CHECK_INTERVAL)
}
