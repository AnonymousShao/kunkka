require('./style/index.less');

var React = require('react');
var MainTable = require('client/components/main_table/index');
var config = require('./config.json');
var __ = require('i18n/client/lang.json');
var router = require('client/dashboard/routers/index');
var request = require('./request');
var equal = require('deep-equal');

class Model extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      config: config
    };

    this.bindEventList = this.bindEventList.bind(this);
    this.clearTableState = this.clearTableState.bind(this);
    this._eventList = {};
    this._stores = {
      checkedRow: []
    };
  }

  componentWillMount() {
    this.bindEventList();
    this.setTableColRender(config.table.column);
    this.listInstance();
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.style.display !== this.props.style.display || !equal(this.state.config, nextState.config)) {
      return true;
    }
    return false;
  }

  bindEventList() {
    this._eventList = {
      tabOnClick: this.tabOnClick,
      btnsOnClick: this.btnsOnClick,
      searchOnChange: this.searchOnChange,
      tableCheckboxOnClick: this.tableCheckboxOnClick.bind(this)
    };
  }

  updateTableData(data) {
    var _conf = this.state.config;
    _conf = JSON.parse(JSON.stringify(_conf));
    _conf.table.column = config.table.column;
    _conf.table.data = data;

    this.setState({
      config: _conf
    });
  }

  listInstance() {
    var that = this;

    request.listInstances().then(function(data) {
      that.updateTableData(data.networks);
    }, function(err) {
      that.updateTableData([]);
      console.debug(err);
    });
  }

  tabOnClick(e, item) {
    if (item.key === 'subnet') {
      router.pushState('/project/subnet');
    }
  }

  setTableColRender(column) {
    column.map((col) => {
      switch (col.key) {
        case 'subnet':
          col.render = (rcol, ritem, rindex) => {
            var listener = (_subnet, _item, _col, _index, e) => {
              e.preventDefault();
              console.log('print ' + _subnet.name, _subnet, _item);
            };

            var subnetRender = [];
            ritem.subnets.map((item, i) => {
              i && subnetRender.push(', ');
              subnetRender.push(<a key={i} onClick={listener.bind(null, item, ritem)} style={{cursor: 'pointer'}}>{item.name}</a>);
            });

            return ritem.subnets.length ? <div>{subnetRender.map((item) => item)}</div> : '';
          };
          break;
        case 'umngd_ntw':
          col.render = (rcol, ritem, rindex) => {
            return ritem.admin_state_up ? __.yes : __.no;
          };
          break;
        case 'status':
          col.render = (rcol, ritem, rindex) => {
            return __[ritem.status.toLowerCase()];
          };
          break;
        default:
          break;
      }
    });
  }

  tableCheckboxOnClick(e, status, clickedRow, arr) {
    // console.log('tableOnClick: ', e, status, clickedRow, arr);
    this.controlBtns(status, clickedRow, arr);
  }

  clearTableState() {
    this.refs.dashboard.clearTableState();
  }

  btnsOnClick(e, key) {
    console.log('Button clicked:', key);
    switch (key) {
      case 'create_instance':
        break;
      case 'refresh':
        // this.clearTableState();
        break;
      default:
        break;
    }
  }

  controlBtns(status, clickedRow, arr) {
    var conf = this.state.config,
      btns = conf.btns;

    btns.map((btn) => {
      switch(btn.key) {
        case 'crt_subnet':
          btn.disabled = (arr.length === 1) ? false : true;
          break;
        case 'delete':
          btn.disabled = (arr.length === 1) ? false : true;
          break;
        default:
          break;
      }
    });

    this._stores.checkedRow = arr;
    this.setState({
      config: conf
    });
  }

  searchOnChange(str) {
    // console.log('search:', str);
  }

  render() {

    return (
      <div className="halo-modules-network" style={this.props.style}>
        <MainTable ref="dashboard" config={this.state.config} eventList={this._eventList}/>
      </div>
    );
  }

}

module.exports = Model;
