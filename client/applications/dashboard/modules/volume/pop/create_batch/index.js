let commonModal = require('client/components/modal_common/index');
let config = require('./config.json');
let request = require('../../request');
let __ = require('locale/client/dashboard.lang.json');
let getErrorMessage = require('client/applications/dashboard/utils/error_message');

let copyObj = function(obj) {
  let newobj = obj.constructor === Array ? [] : {};
  if (typeof obj !== 'object') {
    return newobj;
  } else {
    newobj = JSON.parse(JSON.stringify(obj));
  }
  return newobj;
};

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
      let available = refs.batch_create_volume.state.available;
      let useTotal = 0;
      tableData.forEach(item => {
        let data = {};
        data.name = item.name;
        data.volume_type = item.typesVal;
        data.size = item.size;
        useTotal += item.size;
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
      if (useTotal > available) {
        cb(false, __.tip_Volume_Capacity);
        console.log(useTotal);
        return;
      }
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
