var commonModal = require('client/components/modal_common/index');
var config = require('./config.json');
var __ = require('i18n/client/lang.json');
var request = require('../../request');

function pop(obj, callback, parent) {
  config.fields[0].info = __[config.fields[0].field].replace('{0}', obj.name);

  var props = {
    parent: parent,
    config: config,
    onInitialize: function(refs) {},
    onConfirm: function(refs, cb) {
      var data = {
        external_gateway_info: null
      };
      request.updateRouter(obj.id, data).then((res) => {
        cb(true);
        callback && callback(res.router);
      });
    },
    onAction: function() {}
  };

  commonModal(props);
}

module.exports = pop;
