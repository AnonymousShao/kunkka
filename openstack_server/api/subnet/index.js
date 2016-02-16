var async = require('async');
var Neutron = require('openstack_server/drivers/neutron');
var Nova = require('openstack_server/drivers/nova');
var Base = require('../base');

function Subnet (app, neutron, nova) {
  var that = this;
  this.app = app;
  this.neutron = neutron;
  this.nova = nova;
  this.arrAsync = [];
  this.arrAsyncTarget = ['networks', 'routers', 'ports'];
  this.arrAsyncTarget.forEach(function(ele){
    that.arrAsync.push(function (callback) {
      that.neutron['list' + ele.charAt(0).toUpperCase() + ele.substr(1)](that.token, that.region, that.asyncHandler.bind(this, callback));
    });
  });
}

var makeSubnet = function(subnet, obj) {
  obj.networks.some(function (n) {
    return subnet.network_id === n.id && (subnet.network = n);
  });
  subnet.nics = [];
  subnet.router = {};
  obj.ports.forEach(function (p) {
    p.fixed_ips.some(function (ip) {
      if (ip.subnet_id === subnet.id) {
        if (p.device_owner === 'compute:nova') {
          if (obj.servers) {
            obj.servers.some(function(server) {
              return server.id === p.device_id && (p.instance = server);
            });
          }
          subnet.nics.push(p);
        } else if (p.device_owner === 'network:router_interface') {
          obj.routers.some(function (r) {
            return r.id === p.device_id && (subnet.router = r);
          });
        }
        return true;
      } else {
        return false;
      }
    });
  });
};

var prototype = {
  getSubnetList: function (req, res, next) {
    this.token = req.session.user.token;
    this.region = req.headers.region;
    var that = this;
    async.parallel([
      function (callback) {
        that.neutron.listSubnets(that.token, that.region, that.asyncHandler.bind(this, callback));
      }
    ].concat(that.arrAsync),
    function (err, results) {
      if (err) {
        that.handleError(err, req, res, next);
      } else {
        var obj = {};
        ['subnets'].concat(that.arrAsyncTarget).forEach(function (e, index) {
          obj[e] = results[index][e];
        });
        obj.subnets = obj.subnets.filter(function (s) {
          obj.networks.some(function (n) {
            return n.id === s.network_id && (s.network = n);
          });
          return s.ip_version === 4 && s.network.shared === false && s.network['router:external'] === false;
        });
        obj.subnets.forEach(function (subnet) {
          makeSubnet(subnet, obj);
        });
        res.json({subnets: obj.subnets});
      }
    });
  },
  getSubnetDetails: function (req, res, next) {
    this.projectId = req.params.projectId;
    this.subnetId = req.params.subnetId;
    this.region = req.headers.region;
    this.token = req.session.user.token;
    var that = this;
    async.parallel([
      function (callback) {
        that.neutron.showSubnetDetails(that.subnetId, that.token, that.region, that.asyncHandler.bind(this, callback));
      }
    ].concat(that.arrAsync, [
      function (callback) {
        that.nova.listServers(that.projectId, that.token, that.region, that.asyncHandler.bind(this, callback));
      }
    ]),
    function (err, results) {
      if (err) {
        that.handleError(err, req, res, next);
      } else {
        var obj = {};
        ['subnet'].concat(that.arrAsyncTarget, ['servers']).forEach(function (e, index) {
          obj[e] = results[index][e];
        });
        makeSubnet(obj.subnet, obj);
        res.json({subnet: obj.subnet});
      }
    });
  },
  initRoutes: function () {
    this.app.get('/api/v1/subnets', this.getSubnetList.bind(this));
    this.app.get('/api/v1/:projectId/subnets/:subnetId', this.getSubnetDetails.bind(this));
  }
};
module.exports = function (app, extension) {
  Object.assign(Subnet.prototype, Base.prototype);
  Object.assign(Subnet.prototype, prototype);
  if (extension) {
    Object.assign(Subnet.prototype, extension);
  }
  var subnet = new Subnet(app, Neutron, Nova);
  subnet.initRoutes();
};
