var fetch = require('../../cores/fetch');
var RSVP = require('rsvp');

module.exports = {
  getListInitialize: function(pageLimit, forced) {
    var req = [];
    req.push(this.getList(pageLimit));

    return RSVP.all(req);
  },
  getUserByIDInitialize: function(userID, forced) {
    var req = [];
    req.push(this.getUserByID(userID));

    return RSVP.all(req);
  },
  getList: function(pageLimit) {
    if(isNaN(Number(pageLimit))) {
      pageLimit = 10;
    }

    var url = '/proxy/keystone/v3/users';
    return fetch.get({
      url: url
    }).then((res) => {
      res._url = url;
      return res;
    });
  },
  getNextList: function(nextUrl) {
    var url = '/proxy/keystone/v3/' + nextUrl;
    return fetch.get({
      url: url
    }).then((res) => {
      res._url = url;
      return res;
    });
  },
  getUserByID: function(userID) {
    var url = '/proxy/keystone/v3/users/' + userID;
    return fetch.get({
      url: url
    }).then((res) => {
      res._url = url;
      return res;
    });
  },
  getRelatedResource: function(userID) {
    var deferredList = [];
    deferredList.push(fetch.get({
      url: '/proxy/keystone/v3/users/' + userID + '/groups'
    }));
    deferredList.push(fetch.get({
      url: '/proxy/keystone/v3/users/' + userID + '/projects'
    }));
    return RSVP.all(deferredList);
  },
  deleteItem: function(items) {
    var deferredList = [];
    items.forEach((item) => {
      deferredList.push(fetch.delete({
        url: '/proxy/keystone/v3/users/' + item.id
      }));
    });
    return RSVP.all(deferredList);
  },
  createUser: function(data) {
    return fetch.post({
      url: '/proxy/keystone/v3/users',
      data: {
        user: data
      }
    });
  },
  editUser: function(userID, data) {
    return fetch.patch({
      url: '/proxy/keystone/v3/users/' + userID,
      data: {
        user: data
      }
    });
  },
  getRoleAssignments: function(user) {
    return fetch.get({
      url: '/proxy/keystone/v3/role_assignments?user.id=' + user.id
    }).then((res) => {
      var domainRoles = [],
        projectRoles = [];
      res.role_assignments.forEach((r) => {
        if (r.scope.domain) {
          var domainId = r.scope.domain.id;
          var hasDomain = domainRoles.some((d) => {
            if (d.scope.domain.id === domainId) {
              return true;
            }
            return false;
          });
          if (!hasDomain) {
            domainRoles.push(r);
          }
        } else {
          var projectId = r.scope.project.id;
          var hasProject = projectRoles.some((p) => {
            if (p.scope.project.id === projectId) {
              return true;
            }
            return false;
          });
          if (!hasProject) {
            projectRoles.push(r);
          }
        }
      });
      return {
        domainRoles: domainRoles,
        projectRoles: projectRoles
      };
    });
  },
  getUserRoles: function(roles) {
    var dRoles = {},
      pRoles = {},
      deferredList = [];
    var domainRoles = roles.domainRoles,
      projectRoles = roles.projectRoles;
    domainRoles.forEach((dr) => {
      var domainId = dr.scope.domain.id;
      deferredList.push(fetch.get({
        url: '/proxy/keystone/v3/domains/' + domainId + '/users/' + dr.user.id + '/roles/'
      }));
    });
    projectRoles.forEach((pr) => {
      var projectId = pr.scope.project.id;
      deferredList.push(fetch.get({
        url: '/proxy/keystone/v3/projects/' + projectId + '/users/' + pr.user.id + '/roles/'
      }));
    });
    return RSVP.all(deferredList).then((res) => {
      for (var i = 0; i < res.length; i++) {
        if (i < domainRoles.length) {
          var domainId = domainRoles[i].scope.domain.id;
          dRoles[domainId] = res[i].roles;
        } else {
          var projectId = projectRoles[i - domainRoles.length].scope.project.id;
          pRoles[projectId] = res[i].roles;
        }
      }
      return {
        domainRoles: dRoles,
        projectRoles: pRoles
      };
    });
  },
  getRoles: function() {
    return fetch.get({
      url: '/proxy/keystone/v3/roles'
    });
  },
  addRole: function(type, user, roleID, domainID) {
    if (type === 'domain') {
      return fetch.put({
        url: '/proxy/keystone/v3/domains/' + domainID + '/users/' + user.id + '/roles/' + roleID
      });
    } else {
      return fetch.put({
        url: '/proxy/keystone/v3/projects/' + domainID + '/users/' + user.id + '/roles/' + roleID
      });
    }
  },
  removeRole: function(type, userID, roles, domainID) {
    var deferredList = [];
    if (type === 'domain') {
      roles.forEach((r) => {
        deferredList.push(fetch.delete({
          url: '/proxy/keystone/v3/domains/' + domainID + '/users/' + userID + '/roles/' + r
        }));
      });
    } else {
      roles.forEach((r) => {
        deferredList.push(fetch.delete({
          url: '/proxy/keystone/v3/projects/' + domainID + '/users/' + userID + '/roles/' + r
        }));
      });
    }
    return RSVP.all(deferredList);
  },
  getGroups: function(userID) {
    var deferredList = [];
    deferredList.push(fetch.get({
      url: '/proxy/keystone/v3/groups'
    }));
    deferredList.push(fetch.get({
      url: '/proxy/keystone/v3/users/' + userID + '/groups'
    }));
    return RSVP.all(deferredList).then((res) => {
      var allGroups = res[0].groups,
        joinedGroups = res[1].groups;
      joinedGroups.forEach((i) => {
        allGroups.some((j) => {
          if (i.id === j.id) {
            j.disabled = true;
            return true;
          }
          return false;
        });
      });
      return allGroups;
    });
  },
  joinGroup: function(userID, groupID) {
    return fetch.put({
      url: '/proxy/keystone/v3/groups/' + groupID + '/users/' + userID
    });
  },
  leaveGroup: function(userID, groupID) {
    return fetch.delete({
      url: '/proxy/keystone/v3/groups/' + groupID + '/users/' + userID
    });
  }
};
