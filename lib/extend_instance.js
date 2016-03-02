/*
* @Author: Channer
* @Date:   2016-03-02 11:11:12
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-02 14:52:13
*/

'use strict';
var _ = require('lodash');

// extended instance methods
module.exports = function(Sequelize) {
  return {
    getHistories: function(options) {
      var auditModel = this.Model.auditModel;

      options = _.isUndefined(options) ? {} : options;

      if (!options.where) {
        options.where = {recordId: this.id};
      } else {
        options.where.recordId = this.id;
      }

      return auditModel.findAll(options);
    }
  }
};