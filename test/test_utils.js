/*
* @Author: Channer
* @Date:   2016-03-03 15:35:49
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-03 15:35:49
*/

'use strict';
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var Sequelize = require('sequelize');
var DataTypes = require('sequelize/lib/data-types');

require('../lib/index')(Sequelize);

// database connection info
var db = {
  username: "root",
  password: "",
  database: "sequelize_auditing_test",
  host: "127.0.0.1",
  dialect: "mysql",
  logging: false,
  pool: {
    "maxConnections": 5,
    "minConnections": 0,
    "maxIdleTime": 10000
  }
}

// Make sure errors get thrown when testing
Sequelize.Promise.onPossiblyUnhandledRejection(function(e, promise) {
  throw e;
});
Sequelize.Promise.longStackTraces();


var Utils = {
  Sequelize: Sequelize,

  initTests: function(options) {
    var sequelize = this.createSequelizeInstance();

    this.clearDatabase(sequelize, function() {
      if (options.context) {
        options.context.sequelize = sequelize;
      }

      if (options.beforeComplete) {
        options.beforeComplete(sequelize, DataTypes);
      }

      if (options.onComplete) {
        options.onComplete(sequelize, DataTypes);
      }
    });
  },

  prepareTransactionTest: function(sequelize, callback) {
    if (callback) {
      callback(sequelize);
    } else {
      return Sequelize.Promise.resolve(sequelize);
    }
  },

  createSequelizeInstance: function() {
    return new Sequelize(db.database, db.username, db.password, db);
  },

  clearDatabase: function(sequelize) {
    return sequelize
      .getQueryInterface()
      .dropAllTables()
      .then(function() {
        sequelize.modelManager.daos = [];
        sequelize.models = {};

        return sequelize.getQueryInterface().dropAllEnums();
      });
  }
};

beforeEach(function() {
  this.sequelize = Utils.sequelize;
});

Utils.sequelize = Utils.createSequelizeInstance();
module.exports = Utils;