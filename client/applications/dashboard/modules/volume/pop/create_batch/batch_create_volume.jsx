
const React = require('react');
const {Table} = require('client/uskin/index');
const ButtonList = require('client/components/main/button_list');
import Input from './sub/input';
import Select from './sub/select';
import InputNumber from './sub/input-number';

const __ = require('locale/client/dashboard.lang.json');
const converter = require('client/components/main/converter');
const request = require('../../request');

class Model extends React.Component {

  constructor(props) {
    super(props);
    this.checkedBox = [];
    let config = this.props.config;
    converter.convertLang(__, config);
    this.state = {
      config: config,
      table: config.table
    };

    ['onInitialize', 'onAction'].forEach((m) => {
      this[m] = this[m].bind(this);
    });
  }

  componentWillMount() {}

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  componentWillReceiveProps(nextProps) {}

  componentDidMount () {
    this.onInitialize && this.onInitialize();
  }

  onInitialize() {
    let volumeTypes = [];
    let volumeSource = [{
      id: 'no_source',
      name: __.no_source
    }, {
      id: 'image',
      name: __.image
    }, {
      id: 'volume',
      name: __.volume
    }];
    request.getVolumeTypes().then(res => {
      res.volume_types.forEach(type => {
        volumeTypes.push({
          id: type.name,
          name: type.name
        });
      });
      return request.getSources();
    }).then(res => {
      Object.keys(res).map(key => {
        res[key].forEach((item) => {
          let obj = {};
          switch (key) {
            case 'image':
              obj = {
                id: item.id,
                name: item.name,
                min: item.min_disk || 1
              };
              break;
            case 'volume':
              obj = {
                id: item.id,
                name: item.name,
                min: item.size,
                volume_type: item.volume_type
              };
              break;
            default:
              obj = {
                id: item.id,
                name: item.name,
                min: 1
              };
              break;
          }
          !res[`names_${key}`] ? res[`names_${key}`] = [obj] : res[`names_${key}`].push(obj);
        });
      });
      volumeSource.forEach(i => {
        if (res[`names_${i.id}`]) {
          i.sources = res[`names_${i.id}`];
        }
      });
      return request.getOverview();
    }).then(res => {
      let gigabytes = res.overview_usage.gigabytes;
      let available = gigabytes.total - gigabytes.used;
      let config = JSON.parse(JSON.stringify(this.state.config));
      config.btns.forEach(btn => {
        btn.key === 'add' ? btn.disabled = false : null;
      });
      this.setState({
        config,
        volumeSource,
        volumeTypes,
        available
      });
    });
  }

  onChangeTableCheckbox(isChecked, checkedItem, arr) {
    this.checkedBox = [];
    arr.forEach(i => {
      this.checkedBox.push(i.id);
    });
    let table = JSON.parse(JSON.stringify(this.state.table));
    let sourceTypeOrigin = arr.length && arr[0].sourcesTypesVal;
    let flag = false;
    table.data.forEach(i => {
      if (this.checkedBox.indexOf(i.id) > -1) {
        if (i.sourcesTypesVal !== sourceTypeOrigin && !flag) {
          flag = true;
        }
      }
    });
    table.data.forEach(i => {
      if (this.checkedBox.indexOf(i.id) > -1) {
        i.sourceDisabled = flag;
      } else {
        i.sourceDisabled = false;
      }
    });
    this.tableColRender(table);
    this.setState({
      table
    });
  }

  onAction(filed, actionType, data) {
    switch(filed) {
      case 'btnList':
        this.onBtnListAction(actionType, data);
        break;
      case 'table':
        this.onTableAction(actionType, data);
        break;
      default:
        break;
    }
  }

  onBtnListAction(actionType, data) {
    let table = JSON.parse(JSON.stringify(this.state.table));
    let volumeSource = this.state.volumeSource;
    let volumeTypes = this.state.volumeTypes;
    let item = {
      id: Math.random() + '',
      name: 'default' + (table.data.length + 1),
      sourcesTypes: volumeSource,
      sourcesTypesVal: volumeSource[0],
      sources: volumeSource[0].sources ? volumeSource[0].sources : [],
      sourcesVal: (volumeSource[0].sources && volumeSource[0].sources.length) ? volumeSource[0].sources[0].id : null,
      types: volumeTypes,
      typesVal: volumeTypes[0].id,
      size: 1,
      min: 1
    };
    switch (data.key) {
      case 'add':
        if (!table.data.length) {
          let config = JSON.parse(JSON.stringify(this.state.config));
          config.btns.forEach(btn => {
            btn.key === 'delete' ? btn.disabled = false : void 0;
          });
          this.props.onAction && this.props.onAction('modal', {
            disabled: false
          });
          this.tableColRender(config.table);
          this.setState({
            config
          });
        }
        table.data.push(item);
        break;
      case 'delete':
        table.data = table.data.filter(i => {
          return this.checkedBox.indexOf(i.id) === -1;
        });
        if (!table.data.length) {
          let config = JSON.parse(JSON.stringify(this.state.config));
          config.btns.forEach(btn => {
            btn.key === 'delete' ? btn.disabled = true : void 0;
          });
          this.props.onAction && this.props.onAction('modal', {
            disabled: true
          });
          this.tableColRender(config.table);
          this.setState({
            config
          });
        }
        break;
      default:
        break;
    }
    this.tableColRender(table);
    this.setState({
      table
    });
  }

  onTableAction(actionType, data) {
    let table = JSON.parse(JSON.stringify(this.state.table));
    let currentRow = table.data[data.position.row];
    let checkedBox = this.checkedBox;
    switch(actionType) {
      case 'name':
        if (checkedBox.length && checkedBox.indexOf(currentRow.id) > -1) {
          table.data.forEach(i => {
            if (checkedBox.indexOf(i.id) > -1) {
              i.name = data.value;
            }
          });
        } else {
          currentRow.name = data.value;
        }
        break;
      case 'source_type':
        if (checkedBox.length && checkedBox.indexOf(currentRow.id) > -1) {
          table.data.forEach(i => {
            if (checkedBox.indexOf(i.id) > -1) {
              i.sourceDisabled = false;
              i.sourcesTypes.forEach(m => {
                let sources = m.sources ? m.sources : [];
                m.id === data.value ? i.sources = sources : void 0;
              });
              i.sourcesTypesVal = data.value;
              i.min = (i.sources.length && i.sources[0].min) || 1;
              if (i.sourcesTypesVal === 'volume') {
                i.sourcesVal = i.sources && i.sources[0].id;
                i.typesVal = i.sources[0].volume_type;
                i.typeDisabled = true;
              } else {
                i.sourcesVal = i.sources.length ? i.sources[0].id : null;
                i.typeDisabled = false;
              }
            }
          });
        } else {
          currentRow.sourcesTypes.forEach(i => {
            let sources = i.sources ? i.sources : [];
            i.id === data.value ? currentRow.sources = sources : void 0;
          });
          currentRow.sourcesTypesVal = data.value;
          if (data.value === 'volume') {
            // about the disk_cloud type
            currentRow.sourcesVal = currentRow.sources && currentRow.sources[0].id;
            currentRow.typesVal = currentRow.sources[0].volume_type;
            currentRow.typeDisabled = true;
            currentRow.min = (currentRow.sources.length && currentRow.sources[0].min) || 1;
          } else {
            currentRow.sourcesVal = currentRow.sources.length ? currentRow.sources[0].id : null;
            currentRow.typeDisabled = false;
            currentRow.min = (currentRow.sources.length && currentRow.sources[0].min) || 1;
          }
        }
        break;
      case 'source_instance':
        if (checkedBox.length && checkedBox.indexOf(currentRow.id) > -1) {
          table.data.forEach(i => {
            if (checkedBox.indexOf(i.id) > -1) {
              i.sourcesVal = data.value;
              if (i.sourcesTypesVal === 'volume') {
                let cur = i.sources.filter(item => {
                  return item.id === data.value;
                })[0];
                i.typesVal = cur.volume_type;
                i.typeDisabled = true;
                i.min = cur.min || 1;
                i.size !== i.min ? i.size = i.min : null;
              }
            }
          });
        } else {
          currentRow.sourcesVal = data.value;
          if (currentRow.sourcesTypesVal === 'volume') {
            let cur = currentRow.sources.filter(item => {
              return item.id === data.value;
            })[0];
            currentRow.typesVal = cur.volume_type;
            currentRow.typeDisabled = true;
            currentRow.min = cur.min || 1;
            currentRow.size !== currentRow.min ? currentRow.size = currentRow.min : null;
          }
        }
        break;
      case 'volume_type':
        if (checkedBox.length && checkedBox.indexOf(currentRow.id) > -1) {
          table.data.forEach(i => {
            if (checkedBox.indexOf(i.id) > -1) {
              i.typesVal = data.value;
            }
          });
        } else {
          currentRow.typesVal = data.value;
        }
        break;
      case 'size':
        if (checkedBox.length && checkedBox.indexOf(currentRow.id) > -1) {
          table.data.forEach(i => {
            if (checkedBox.indexOf(i.id) > -1) {
              i.size = data.value;
            }
          });
        } else {
          currentRow.size = data.value;
        }
        break;
      default:
        break;
    }
    this.tableColRender(table);
    this.setState({
      table
    });
  }

  tableColRender(data) {
    let columns = data.column;
    columns.map((column) => {
      let that = this;
      switch (column.type_) {
        case 'input':
          column.render = (col, item, i) => {
            return that.colInputRender(col, item, i);
          };
          break;
        case 'select':
          column.render = (col, item, i) => {
            return that.colSelectRender(col, item, i);
          };
          break;
        default:
          break;
      }
    });
  }

  colInputRender(col, item, index) {
    let el;
    let key = col.key;
    switch (key) {
      case 'name':
        el = <Input
          style={{width: '70%', height: '20px'}}
          position={{row: index}}
          key={Math.random() + ''}
          value={item.name}
          type={key}
          onAction={this.onAction.bind(this)}/>;
        break;
      case 'size':
        el = <div>
          <InputNumber
            key={Math.random() + ''}
            position={{row: index}}
            type={key}
            value= {item.size}
            sdtep={1}
            min={item.min || 1}
            max={1000}
            onChange={this.onAction.bind(this)}/><span>&nbsp;&nbsp;GB</span>
        </div>;
        break;
      default:
        break;
    }
    return el;
  }

  colSelectRender (col, data, index) {
    let el;
    let key = col.key;
    switch(key) {
      case 'source_type':
        el = <Select style={{width: '70%', height: '20px', lineHeight: '20px', marginTop: '5px'}}
                     position={{row: index}}
                     data={data.sourcesTypes}
                     value={data.sourcesTypesVal}
                     type = {key}
                     onAction={this.onAction.bind(this)} />;
        break;
      case 'source_instance':
        el = <Select
          style={{width: '70%', height: '20px', lineHeight: '20px', marginTop: '5px'}}
          position={{row: index}}
          type={key}
          value={data.sourcesVal}
          data={data.sources}
          disabled={data.sourceDisabled ? data.sourceDisabled : false}
          onAction={this.onAction.bind(this)} />;
        break;
      case 'volume_type':
        el = <Select
          style={{width: '70%', height: '20px', lineHeight: '20px', marginTop: '5px'}}
          position={{row: index}}
          type={key}
          data={data.types}
          value={data.typesVal}
          disabled={data.typeDisabled ? data.typeDisabled : false}
         onAction={this.onAction.bind(this)} />;
        break;
      default:
        break;
    }
    return el;
  }

  render() {
    return (
      <div style={{paddingLeft: '20px'}}>
        <div style={{paddingBottom: '10px', position: 'relative'}}>
          <ButtonList
            ref="btnList"
            btns={this.state.config.btns}
            onAction={this.onAction.bind(this)} />
          <span style={{position: 'absolute', right: 0, top: 0}}>{__.available} : {this.state.available} GB</span>
        </div>
        <div className="table-container" style={this.props.style}>
          {!this.state.table.loading && !this.state.table.data.length ?
            <div className="table-with-no-data">
              <Table
                ref="table"
                column={this.state.table.column}
                onInitialize={this.onInitialize.bind(this)}
                data={[]}
                checkbox={this.state.table.checkbox} />
              <p>
                {__.there_is_no + __.data + __.full_stop}
              </p>
            </div>
            : <Table
              ref="table"
              onInitialize={this.onInitialize.bind(this)}
              column={this.state.table.column}
              data={this.state.table.data}
              dataKey={this.state.table.dataKey}
              loading={this.state.table.loading}
              checkbox={this.state.table.checkbox}
              checkboxOnChange={this.onChangeTableCheckbox.bind(this)}
              onAction={this.onAction.bind(this)}
              striped={true} />
          }
        </div>
      </div>
    );
  }

}

module.exports = Model;
