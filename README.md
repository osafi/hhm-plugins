# hhm-plugins

## After release

HHM plugins load from github through the jsdelivr CDN. To have the changes propagate
use the purge endpoint:

https://purge.jsdelivr.net/gh/osafi/hhm-plugins@master/src/osafi/register-route.js

## TODO

- Add a github action to call purge endpoint for each plugin automatically
