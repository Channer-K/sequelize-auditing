/*
* @Author: Channer
* @Date:   2016-02-29 17:50:28
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-02 16:40:22
*/

'use strict';

var _ = require('lodash');
var extInstance = require('./extend_instance');

// extended model methods
module.exports = function(Sequelize) {
  var hooks = require('./extend_hooks')(Sequelize);

  return {
    makeAuditable: function(options) {
      var sequelize = this.sequelize;
      var Sequelize = sequelize.Sequelize;
      var Utils = Sequelize.Utils;

      if (sequelize.options.auditable) {
        throw new Sequelize.AuditingError('Duplicate definition. You can ONLY use ONE of function `.makeAuditable()` or model options in %s', model.name);
      }

      options = typeof options !== 'undefined' ?  options : {};

      _.defaults(options, {
        tableSuffix: '_history',
        excludeFields: [],
      });

      var auditTableName = this.getTableName().toLowerCase() + options.tableSuffix;

      // To do a deep clone from original table
      var originalModelAttrs = Utils.cloneDeep(this.attributes);

      if (!Array.isArray(options.excludeFields)) {
        throw new Sequelize.AuditingTypeError("`excludeFields` is not an array.");
      }

      var excludeFields = _.union(['id', 'updatedAt', 'createdAt'], options.excludeFields);

      for (var field of excludeFields) {
        // To remove some fields from original table if exist
        if (originalModelAttrs.hasOwnProperty(field)) {
          delete originalModelAttrs[field];
        }
      }

      /**
       *  To expand the attributes for audit table
       *  Four fields added: `action`, `recordId`, `createdAt` and `changeLog`
       *
       *  `action` indicate how the record operated, can be updated or deleted
       *  `recordId` means the primary key for the record operated
       *  `createdAt` show when the operation occur
       *  `changeLog` is a string of all changes made
       */
      var auditModelFields = _.assign({
        action: {
          type: Sequelize.ENUM('updated', 'deleted'),
          allowNull: false
        },
        recordId: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false
        }
      }, originalModelAttrs, {
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        changeLog: {
          type: Sequelize.TEXT
        }
      });

      var auditModel = sequelize.define(auditTableName, auditModelFields, {
        timestamps: false,
        paranoid: false,
        freezeTableName: true,
        tableName: auditTableName,
        defaultScope: {
          order: [['createdAt', 'desc']]
        },
        indexes: [{fields: ['recordId']}]
      });

      // record audit model
      this.auditModel = auditModel;
      this.auditModel['excludeFields'] = excludeFields;

      // bind some useful functions to Instance.prototype
      _.assignIn(this.Instance.prototype, extInstance(Sequelize));

      // add hooks
      _.forIn(hooks, function(hookFn, hookName) {
        this.addHook(hookName, hookFn);
      }.bind(this));

      return this; // for chaining
    }
  }
}
