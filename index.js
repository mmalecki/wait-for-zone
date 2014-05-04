'use strict';

var fs = require('fs')
  , path = require('path')
  , spawn = require('child_process').spawn
  , concatStream = require('concat-stream')

var CHECK_INTERVAL = 1000

module.exports = function(uuid, callback) {
  // You thought that waiting for a zone to provision was as simple as waiting
  // for `vmadm create` to exit? Nope.
  // As it turns out, each zone after being provisioned by `vmadm` and `vmadmd`
  // is set to be "finalized" by `zoneinit`: https://github.com/joyent/zoneinit
  // The worst thing about `zoneinit` is that it reboots the zone when it's
  // done. So if you open a `zlogin` shell to a zone which has been just
  // `vmadm create`'d, you're going to be logged out very fast.
  //
  // This is a huge problem from the point of view of automation.
  // This module was created to prevent failures like that by checking for
  // existance of `/tmp/.FIRST_REBOOT_NOT_COMPLETE_YET`:
  // https://github.com/joyent/zoneinit/blob/8eedecc075dd4cb8d1ec240cb3e5f741604e1cca/includes/01-reboot-file.sh#L4,
  // in addition to verifying zone's state with `vmadm`.

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
