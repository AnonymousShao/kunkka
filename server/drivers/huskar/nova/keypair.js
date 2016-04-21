'use strict';

var Base = require('../base.js');
var driver = new Base('nova');

driver.listKeypairs = function (projectId, token, region, callback, query) {
  return driver.getMethod(
    driver.remote[region] + '/v2.1/' + projectId + '/os-keypairs',
    token,
    callback,
    query
  );
};

module.exports = driver;
