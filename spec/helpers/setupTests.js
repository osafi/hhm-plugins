const nock = require('nock');
const td = require('testdouble');

global.fetch = require('node-fetch');
global.btoa = (str) => Buffer.from(str).toString('base64');

beforeEach(() => {
  td.reset();
  nock.disableNetConnect();
});
