const commonModal = require('client/components/modal_common/index');
const config = require('./config.json');
const request = require('../../request');
const __ = require('locale/client/bill.lang.json');
// const getErrorMessage = require('../../../../utils/error_message');

function pop(obj, parent, callback) {

  let props = {
    __: __,
    parent: parent,
    config: config,
    onInitialize: function(refs) {
    },
    onConfirm: function(refs, cb) {
      const startTime = refs.range_time.state.value.start;
      const endTime = refs.range_time.state.value.end;
      let data = {
        format: refs.format.state.value
      };
      if(startTime && endTime) {
        data.startTime = startTime;
        data.endTime = endTime;
      }
      request.export(data).then(res => {
        callback && callback();
        cb(true);
      });
    },
    onAction: function(field, state, refs) {
    }
  };

  commonModal(props);
}

module.exports = pop;
