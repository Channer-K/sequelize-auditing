/*
* @Author: Channer
* @Date:   2016-02-29 18:14:15
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-02 14:34:34
*/

'use strict';
var _ = require('lodash');

module.exports = function(Sequelize) {
  return {
    beforeUpdate: function(record, options) {
      var model = record.Model;
      // var Promise = model.sequelize.Sequelize.Promise;
      var auditModel = model.auditModel;

      // return if not yet change
      if (!record.changed()) return;

      var newAttrsClone = _.cloneDeep(record.get());
      var oldAttrs      = _.merge(newAttrsClone, record.previous());
      oldAttrs          = _.omit(oldAttrs, auditModel.excludeFields);

      var newAttrs =  _.assign(oldAttrs, {
        recordId: record.id,
        action: 'updated',
        changeLog: JSON.stringify(record.changed())
      });

      return auditModel.create(newAttrs, {transaction: options.transaction})
      .then(function(history) {
        if (!history) throw Sequelize.SequelizeAuditingError('Failed to insert audit record!');
      });
    },
    beforeBulkUpdate: function(options) {
      // set individualHooks is true to emit hooks for each individual record
      options.individualHooks = true;
    },
    beforeDestroy: function(record, options) {
      var model = record.Model;
      var auditModel = model.auditModel;

      var AttrsClone = _.cloneDeep(record.get());
      var exAttrs    = _.omit(AttrsClone, auditModel.excludeFields);

      var Attrs =  _.assign(exAttrs, {
        recordId: record.id,
        action: 'deleted'
      });

      return auditModel.create(Attrs, {transaction: options.transaction})
      .then(function(history) {
        if (!history) throw Sequelize.SequelizeAuditingError('Failed to insert audit record!');
      });
    },
    beforeBulkDestroy: function(options) {
      // set individualHooks is true to emit hooks for each individual record
      options.individualHooks = true;
    }
  }
};
