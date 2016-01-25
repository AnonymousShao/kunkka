var React = require('react');
var NavBar = require('client/components/navbar/index');
var SideMenu = require('client/components/side_menu/index');

var loader = require('./cores/loader'),
  configs = loader.configs;

class Model extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      modules: []
    };

    this.onClickSubmenu = this.onClickSubmenu.bind(this);
    this.onChangeState = this.onChangeState.bind(this);
  }

  loadRouter() {
    this.router = require('./routers/index');
    this.router.on('changeState', this.onChangeState);

    var pathList = this.router.getPathList();
    if (pathList.length > 1) {
      configs.default_module = pathList[1];
    } else {
      this.router.replaceState('/project/' + configs.default_module);
    }
  }

  onChangeState(pathList) {
    var _moduleName = pathList[1],
      modules = this.state.modules;
    if (modules.indexOf(_moduleName) === -1) {
      modules = modules.concat(_moduleName);
    }

    this.setState({
      modules: modules,
      selectedModule: pathList[1],
      selectedMenu: this._filterMenu(_moduleName)
    });
  }

  _filterMenu(item) {
    var ret = item;
    configs.routers.some((m) => {
      if (item === m.key) {
        ret = m.link;
        return true;
      }
      return false;
    });
    return ret;
  }

  updateModules() {
    //Object.keys(loader.modules)
    var _defaultModule = configs.default_module;
    this.setState({
      modules: [_defaultModule],
      selectedModule: _defaultModule,
      selectedMenu: this._filterMenu(_defaultModule)
    });
  }

  componentDidMount() {
    this.loadRouter();
    this.updateModules();
  }

  componentWillUpdate() {
    console.time('dashboard');
  }

  componentDidUpdate() {
    console.timeEnd('dashboard');
  }

  onClickSubmenu(e, m) {
    this.router.pushState('/project/' + m.key);
  }

  render() {
    var state = this.state,
      props = this.props,
      __ = props.language;
    var modules = loader.modules;

    var submenu = [];

    props.menus.forEach((m) => {
      submenu.push({
        subtitle: __[m],
        key: m,
        onClick: this.onClickSubmenu,
        iconClass: 'glyphicon icon-' + m,
        selected: m === state.selectedMenu ? true : false
      });
    });

    var items = [{
      title: __.project,
      key: 'project',
      submenu: submenu
    }];

    return (
      <div id="wrapper">
        <div id="navbar">
          <NavBar />
        </div>
        <div id="main-wrapper">
          <SideMenu items={items} />
          <div id="main">
            {
              state.modules.map((m, index) => {
                var M = modules[m];
                return <M key={index} style={state.selectedModule === m ? {display: 'flex'} : {display: 'none'}} />;
              })
            }
          </div>
        </div>
      </div>
    );
  }

}

function filterMenu(list) {
  return list.filter((m) => {
    var b = configs.routers.some((n) => {
      if (n.key === m) {
        return true;
      }
      return false;
    });
    return !b;
  });
}

Model.defaultProps = {
  menus: filterMenu(Object.keys(loader.modules))
};

module.exports = Model;
