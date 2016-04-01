require('./style/index.less');

var ReactDOM = require('react-dom');
var React = require('react');
var Model = require('./model');
var __ = require('i18n/client/lang.json');

var dashboardModel = React.createFactory(Model);

ReactDOM.render(
  dashboardModel({
    language: __,
    HALO: HALO
  }),
  document.getElementById('container')
);
