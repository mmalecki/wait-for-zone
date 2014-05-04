# wait-for-zone
Wait for a SmartOS zone to become fully available.

You thought that waiting for a zone to provision was as simple as waiting
for `vmadm create` to exit? Nope.
As it turns out, after being provisioned by `vmadm` and `vmadmd`, each zone
is set to be "finalized" by [`zoneinit`](https://github.com/joyent/zoneinit).

The worst thing about `zoneinit` is that it reboots the zone when it's
done. So if you open a `zlogin` shell to a zone which has been just
`vmadm create`'d, you're going to be logged out very fast.

This is a huge problem from the point of view of automation.
This module was created to prevent failures like that by checking for
existance of [`/tmp/.FIRST_REBOOT_NOT_COMPLETE_YET`](https://github.com/joyent/zoneinit/blob/8eedecc075dd4cb8d1ec240cb3e5f741604e1cca/includes/01-reboot-file.sh#L4),
in addition to verifying zone's state with `vmadm`.

## Installation
```sh
npm install wait-for-zone
```

## Usage
```js
var waitForZone = require('wait-for-zone')
waitForZone('bd0e5bd6-aa98-411b-90a9-693cb6d79eeb', function (err) {
  // If callback is called with no error, zone is up and running.
  // If error occured, it's passed to the callback.
})
```
