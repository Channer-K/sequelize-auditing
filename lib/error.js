/*
* @Author: Channer
* @Date:   2016-03-01 09:47:35
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-01 16:16:07
*/

'use strict';
var _ = require('lodash');
var util = require('util');

module.exports = {
  init: function(Sequelize) {
    var errors = {};

    // general error for all auditing errors
    errors.AuditingError = function(message) {
      Sequelize.Error.call(this, message);
      this.name = 'SequelizeAuditingError';
    };
    errors.AuditingTypeError = function(message) {
      Sequelize.Error.call(this, message);
      this.name = 'SequelizeAuditingTypeError';
    };
    util.inherits(errors.AuditingError, Sequelize.Error);
    util.inherits(errors.AuditingTypeError, Sequelize.Error);

    // alias for error for backward-compatibility
    errors.SequelizeAuditingError = errors.AuditingError;
    errors.SequelizeAuditingTypeError = errors.SequelizeAuditingTypeError;

    // add errors to Sequelize and sequelize
    _.extend(Sequelize, errors);
    _.extend(Sequelize.prototype, errors);
  }
};
