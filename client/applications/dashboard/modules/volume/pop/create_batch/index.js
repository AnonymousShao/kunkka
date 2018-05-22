let commonModal = require('client/components/modal_common/index');
let config = require('./config.json');
let request = require('../../request');
let __ = require('locale/client/dashboard.lang.json');
let getErrorMessage = require('client/applications/dashboard/utils/error_message');

const ENABLE_CHARGE = HALO.settings.enable_charge;
const DEFAULT_PRICE = '0.0000';
const UNITNUMBER = 1024 * 1024 * 1024;

let copyObj = function(obj) {
  let newobj = obj.constructor === Array ? [] : {};
  if (typeof obj !== 'object') {
    return newobj;
  } else {
    newobj = JSON.parse(JSON.stringify(obj));
  }
  return newobj;
};

function getCapacitySize(refs, state, type) {
  let item = state.data.filter(_data => _data.id === state.value);
  let size, minValue;

  switch(type) {
    case 'image':
      size = item[0] && Math.ceil(item[0].size / UNITNUMBER);
      break;
    default:
      size = item[0] && item[0].size;
      break;
  }

  let value = minValue = size < 1 ? 1 : size;

  refs.capacity_size.setState({
    value: value,
    inputValue: value,
    min: minValue || 1
  });
}

function pop(obj, parent, callback) {
  let copyConfig = copyObj(config);
  if (obj) {
    copyConfig.fields[1].hide = true;
    copyConfig.fields.unshift({
      type: 'icon_label',
      field: 'snapshot',
      icon_type: 'snapshot',
      text: obj.name
    });
  }

  let props = {
    __: __,
    parent: parent,
    config: copyConfig,
    width: 760,
    onInitialize: function(refs) {},
    onConfirm: function(refs, cb) {
      let reqData = [];
      let tableData = JSON.parse(JSON.stringify(refs.batch_create_volume.state.table.data));
      tableData.forEach(item => {
        let data = {};
        data.name = item.name;
        data.volume_type = item.typesVal;
        data.size = item.size;
        if (obj) {
          data.snapshot_id = obj.id;
        }
        let volumeSource = item.sourcesTypesVal;
        switch (volumeSource) {
          case 'image':
            data.imageRef = item.sourcesVal;
            break;
          case 'volume':
            data.source_volid = item.sourcesVal;
            break;
          default:
            break;
        }
        reqData.push(data);
      });
      request.batchCreateVolume(reqData).then((res) => {
        callback && callback(res);
        cb(true);
      }).catch((err) => {
        cb(false, getErrorMessage(err));
      });
    },
    onAction: function(field, state, refs) {
      switch (field) {
        case 'modal':
          refs.btn.setState({
            disabled: state.disabled
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
