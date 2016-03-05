require('./style/index.less');

var React = require('react');
var Request = require('client/dashboard/cores/request');
var router = require('client/dashboard/cores/router');
var mainEvent = require('../main/event');

class VncConsole extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      data: []
    };
    this.refresh;
    this.onChangeState = this.onChangeState.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.getData = this.getData.bind(this);
    this.loading = this.loading.bind(this);
    this.run = this.run.bind(this);
  }

  componentWillMount() {
    if (this.props.refresh) {
      this.loading();
      this.run();
    }

    router.on('changeState', this.onChangeState);
    mainEvent.on('changeTab', this.onChangeTab);
  }

  componentWillReceiveProps(nextProps) {
    this.stopRefreshing();
    this.loading();
    this.run();
  }

  componentWillUnmount() {
    this.stopRefreshing();

    router.removeListener('changeState', this.onChangeState);
    mainEvent.removeListener('changeTab', this.onChangeTab);
  }

  onChangeState(pathList) {
    if (!pathList[2] || (pathList[0] === 'project' && pathList[1] !== this.props.moduleID)) {
      this.stopRefreshing();
    }
  }

  onChangeTab(tab) {
    this.detailTabKey = tab.key;
    if (tab.key !== this.props.tabKey) {
      this.stopRefreshing();
    } else {
      this.loading();
      this.run();
    }
  }

  getData() {
    Request.post({
      url: this.props.url
    }).then((res) => {
      if (this.refresh) {
        this.setState({
          loading: false,
          data: res.output.split('\n')
        });
      }
    }, (err) => {
      //console.log(err);
    });
  }

  loading() {
    this.setState({
      loading: true
    });
  }

  run() {
    this.getData();
    if (this.props.refresh) {
      this.refresh = window.setInterval(this.getData, 1500);
    }
  }

  stopRefreshing() {
    window.clearInterval(this.refresh);
    this.refresh = undefined;
  }

  render() {
    var data = this.state.data;

    return (
      <div className="halo-com-console-output" data-id={this.props['data-id']}>
        {this.state.loading ?
          <div className="detail-loading">
            <i className="glyphicon icon-loading" />
          </div>
        : <div className="output">
            {data.map((item, i) =>
              <p key={i}>{item}</p>
            )}
          </div>
        }
      </div>
    );
  }

}

module.exports = VncConsole;
