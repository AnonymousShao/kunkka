const commonModal = require('client/components/modal_common/index');
const config = require('./config.json');
const request = require('../../request');
const __ = require('locale/client/approval.lang.json');
const getStatusIcon = require('../../../../utils/status_icon');

function pop(obj, parent, callback) {

  config.fields[0].data = obj;
  config.fields[0].getStatusIcon = getStatusIcon;

  let hasActive = obj.some((ele) => ele.status.toLowerCase() === 'active');
  config.fields[1].hide = !hasActive;
  config.btn.disabled = hasActive;

  let props = {
    __: __,
    parent: parent,
    config: config,
    onInitialize: function(refs) {},
    onConfirm: function(refs, cb) {
      request.deleteItem(obj).then((res) => {
        cb(true);
        callback && callback(res);
      });
    },
    onAction: function(field, state, refs) {
      switch(field) {
        case 'delete_instance_tip':
          refs.btn.setState({
            disabled: !state.checked
          });
          break;
        default:
          break;
      }
    }
  };

  commonModal(props);
}

module.exports = pop;
