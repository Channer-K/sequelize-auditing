/*
* @Author: Channer
* @Date:   2016-02-29 17:58:45
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-02 14:45:43
*/

'use strict';

var _ = require('lodash');
var error = require('./error');
var extModel = require('./extend_model');

module.exports = function(Sequelize) {
  if (!Sequelize) Sequelize = require('sequelize');

  // add custom error
  error.init(Sequelize);

  _.extend(Sequelize.Model.prototype, extModel(Sequelize));

  Sequelize.addHook('afterInit', function(sequelize) {
    sequelize.addHook('afterDefine', function(model) {
      var Sequelize = this.Sequelize;
      var Utils = Sequelize.Utils;

      var auditable = model.options.auditable;

      if (auditable) {
        model.makeAuditable();
      }
    });
  });

  return Sequelize;
};
