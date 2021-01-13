#!/usr/bin/env sh
set -e

for i in src/osafi/*.js; do
  curl "https://purge.jsdelivr.net/gh/osafi/hhm-plugins@master/$i"
done