const nock = require('nock');
nock.disableNetConnect();

global.fetch = require('node-fetch');
global.btoa = (str) => Buffer.from(str).toString('base64');