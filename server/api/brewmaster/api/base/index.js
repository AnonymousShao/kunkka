'use strict';
const co = require('co');
const uuid = require('uuid');
const glob = require('glob');

const drivers = require('drivers');
const userModel = require('../../models').user;

const config = require('config');
const keystoneRemote = config('keystone');
const TOKEN_EXPIRE = config('reg_token_expire') || 60 * 60 * 24;
const SMS_CODE_EXPIRE = config('reg_sms_expire') || 60 * 10;
const adminLogin = require('api/slardar/common/adminLogin');

const getUserAsync = drivers.keystone.user.getUserAsync;
const listUsersAsync = drivers.keystone.user.listUsersAsync;
const uskinFile = glob.sync('*.uskin.min.css', {cwd: 'client/dist/uskin'})[0];

const password = require('./password');
const passwordModel = require('../../models').user_password;

const base = {func: {}, middleware: {}, password};


base.__getUserAsync = function (objVar) {
  return drivers.keystone.user.getUserAsync(objVar.token, keystoneRemote, objVar.userId);
};
base.__unscopedAuthAsync = function (objVar) {
  return drivers.keystone.authAndToken.unscopedAuthAsync(objVar.username, objVar.password, objVar.domain, keystoneRemote);
};
base.__scopedAuthAsync = function (objVar) {
  return drivers.keystone.authAndToken.scopedAuthAsync(objVar.projectId, objVar.token, keystoneRemote);
};
base.__userProjectsAsync = function (objVar) {
  return drivers.keystone.project.getUserProjectsAsync(objVar.userId, objVar.token, keystoneRemote);
};
base.__listUsersAsync = function (objVar) {
  return drivers.keystone.user.listUsersAsync(objVar.token, keystoneRemote, objVar.query);
};

base._getSettingsByApp = require('api/tusk/dao').getSettingsByApp;
base._getSettingByAppAndName = require('api/tusk/dao').getSettingByAppAndName;

base.getVars = function (req, extra) {
  let objVar = {
    token: req.session.user.token,
    endpoint: req.session.endpoint,
    region: req.headers.region,
    query: req.query
  };
  /* general user to delete tenant_id. */
  if (!req.session.user.isAdmin && objVar.query.tenant_id) {
    delete objVar.query.tenant_id;
  }
  if (extra) {
    extra.forEach(e => {
      objVar[e] = req.params[e];
    });
  }
  return objVar;
};

base.func.phoneCaptchaMemAsync = function* (opts) {
  const {__, phone, memClient, usage = ''} = opts;
  let isFrequently = yield base.func.checkFrequentlyAsync(phone.toString(), memClient);
  if (isFrequently) {
    return {customRes: true, msg: 'Frequently', status: 400};
  }
  let code = Math.random() * 900000 | 100000;
  yield base.func.setKeyValueAsync({
    key: phone.toString(),
    value: code,
    memClient,
    expire: SMS_CODE_EXPIRE
  });
  let corporationName = 'UnitedStack 有云';
  let settings = yield base._getSettingsByApp('auth');
  settings.some(setting => {
    return setting.name === 'corporation_name' && (corporationName = setting.value);
  });

  let smsContent = `【${corporationName}】${usage && __('api.register.' + usage)}${__('api.register.VerificationCode')} ${code}`;
  let result = yield drivers.sms.smsAsync(phone.toString(), smsContent);

  if (result.text === '00') {
    return {customRes: true, msg: 'SendSmsSuccess', status: 200};
  } else {
    return {customRes: true, msg: 'smsSendError', status: 500};
  }
};

base.middleware.customResApi = function (err, req, res, next) {
  let __ = req.i18n.__.bind(req.i18n);
  if (err.customRes === true) {
    err.message = __('api.register.' + err.msg);
    res.status(err.status || 500).send(err);
  } else if (err && err.status) {
    next(err);
  } else {
    next(__('api.register.SystemError'));
  }
};

base.middleware.customResPage = function (err, req, res, next) {
  console.log(err);
  const __ = req.i18n.__.bind(req.i18n);
  co(function* () {
    if (err.customRes && err.msg) {
      err.message = __('api.register.' + err.msg || err.message);
    }
    const obj = yield base.func.getTemplateObjAsync();
    Object.assign(
      obj,
      {subtitle: '', message: err.message || __('api.register.SystemError'), locale: req.i18n.locale},
      err.data
    );
    res.status(err.code || 200).render(err.view || 'single', obj);
  }).catch(() => {
    const obj = {
      single_logo_url: '/static/assets/nav_logo.png',
      favicon: '/static/login/favicon.ico',
      title: 'UnitedStack 有云',
      default_image_url: '',
      company: '©2016 UnitedStack Inc. All Rights Reserved. 京ICP备13015821号',
      corporation_name: 'UnitedStack 有云',
      subtitle: '',
      message: __('api.register.SystemError'),
      locale: req.i18n.locale,
      uskinFile: uskinFile
    };
    res.render('single', obj);
  });
};


base.middleware.adminLogin = function (req, res, next) {
  adminLogin(function (err, result) {
    if (err) {
      next(err);
    } else {
      req.admin = {token: result.token};
      next();
    }
  });
};

base.middleware.checkLogin = function (req, res, next) {
  if (!req.session || !req.session.user) {
    res.status(403).json({error: 'Permission Denied'});
  } else {
    next();
  }
};

/*** Promise ***/
base.func.verifyUserByNameAsync = function (adminToken, name) {
  return co(function* () {
    const result = yield listUsersAsync(adminToken, keystoneRemote, {name});
    const users = result.body.users;
    if (Array.isArray(users) && users.length) {
      return users[0];
    } else {
      yield userModel.destroy({where: {name}});
      return false;
    }
  });
};

base.func.verifyUserByIdAsync = (adminToken, userId) => {
  return co(function* () {
    let user;
    let userDB = yield userModel.findOne({where: {id: userId}});
    try {
      let result = yield getUserAsync(adminToken, keystoneRemote, userId);
      user = result.body.user;
    } catch (e) {
      if (e.statusCode === 404) {
        yield userModel.destroy({where: {id: userId}, force: true});
        return false;
      } else {
        return Promise.reject(e);
      }
    }
    if (!userDB) {
      userModel.create(user);
    } else {
      Object.assign(user, JSON.parse(JSON.stringify(userDB)));
    }
    return user;
  });
};

base.func.emailTokenMemAsync = function (user, memClient) {
  return co(function* () {
    let isFrequently = yield base.func.checkFrequentlyAsync(user.id, memClient);
    if (isFrequently) {
      return Promise.reject({status: 400, customRes: true, msg: 'Frequently'});
    } else {
      let value = uuid.v4();
      yield base.func.setKeyValueAsync({key: user.id, value, expire: TOKEN_EXPIRE, memClient});
      return value;
    }
  });
};

base.func.verifyUserAsync = function (adminToken, where) {
  return co(function* () {
    const userDB = yield userModel.findOne({where});
    if (!userDB) {
      return false;
    }
    let user;
    try {
      const userKeystoneRes = yield getUserAsync(adminToken, keystoneRemote, userDB.id);
      user = userKeystoneRes.body.user;
    } catch (e) {
      if (e.status === 404) {
        yield userModel.destroy({where, force: true});
        return false;
      } else {
        return Promise.reject(e);
      }
    }
    user.email = userDB.email;
    user.phone = userDB.phone;
    user.status = userDB.status;
    return user;
  });
};

base.func.getTemplateObjAsync = () => {
  return co(function* () {
    let settings = yield [
      base._getSettingsByApp('global'),
      base._getSettingsByApp('auth')
    ];
    let sets = {};
    settings.forEach(setting => setting.forEach(s => sets[s.name] = s.value));
    sets.uskinFile = uskinFile;
    return sets;
  });
};


base.func.checkUserEnabledAsync = function (adminToken, where) {
  return co(function* () {
    const result = yield base.func.verifyUserAsync(adminToken, where);
    const user = result.user;
    if (!result.exist) {
      return Promise.reject({code: 404, message: 'UserNotExist'});
    } else if (user) {
      return !!user.enabled;
    } else {
      return Promise.reject({code: 500, message: 'SystemError'});
    }
  });
};

base.func.checkFrequentlyAsync = function (key, memClient) {
  return co(function* () {
    let valOld = yield memClient.getAsync(key);
    valOld = valOld[0] && valOld[0].toString();
    if (!valOld) {
      return false;
    } else {
      valOld = JSON.parse(valOld);
      return new Date().getTime() - valOld.createdAt < 55000;
    }
  });
};

base.func.verifyKeyValueAsync = (key, value, memClient) => {
  return co(function* () {
    let memValue = yield memClient.getAsync(key.toString());
    memValue = memValue[0] && memValue[0].toString();
    if (!memValue) {
      return false;
    } else {
      memValue = JSON.parse(memValue);
      return memValue.value.toString() === value.toString();
    }
  });
};

base.func.setKeyValueAsync = (opt) => {
  return co(function* () {
    const key = opt.key;
    const value = opt.value;
    const expire = opt.expire;
    const memClient = opt.memClient;
    const createdAt = new Date().getTime();
    yield memClient.setAsync(key, JSON.stringify({value, createdAt, expire}), expire);
  });
};

base.middleware.checkEnableRegister = (req, res, next) => {
  co(function* () {
    let settings = yield base._getSettingsByApp('global');
    let enableRegister, enableRegisterApprove = false;
    let flag = 0;
    settings.some(setting => {
      if (setting.name === 'enable_register') {
        enableRegister = setting.value;
        flag++;
      } else if (setting.name === 'enable_register_approve') {
        enableRegisterApprove = setting.value;
        flag++;
      }
      return flag === 2;
    });
    if (enableRegister) {
      req.enableRegisterApprove = enableRegisterApprove;
      next();
    } else {
      next({
        customRes: true,
        msg: 'registerIsProhibited'
      });
    }
  }).catch(next);
};
base.middleware.checkAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({error: req.i18n.__('api.keystone.unauthorized')});
  }
  if (req.session.user.isAdmin) {
    next();
  } else {
    res.status(403);
    res.send({message: req.i18n.__('api.register.adminAccessNeeded')});
  }
};

base.func.checkPasswordAvailable = function* (userId, reqPass) {
  const passwords = yield passwordModel.findAll({
    where: {userId},
    order: [['createdAt', 'DESC']],
    limit: 3
  });
  let isAvailable = true;

  for (let i = 0; i < passwords.length; i++) {
    let compare = yield base.password.compare(reqPass, passwords[i].password);
    if (compare) {
      isAvailable = false;
      break;
    }
  }
  return isAvailable;
};
module.exports = base;
