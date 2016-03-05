/*
* @Author: Channer
* @Date:   2016-03-03 15:35:54
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-03 15:35:54
*/

'use strict';

var _ = require('lodash');
var config = require('./config');
var Sequelize = require('sequelize');
require('../lib/index')(Sequelize);

// Make sure errors get thrown when testing
Sequelize.Promise.onPossiblyUnhandledRejection(function(e, promise) {
  throw e;
});
Sequelize.Promise.longStackTraces();


var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var sequelize;
var sequelizeVersion = require('sequelize/package.json').version;

console.log('Sequelize version:', sequelizeVersion);

describe('Sequelize-auditing Tests', function () {
  before(function() {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  });

  afterEach(function(done) {
    sequelize.getQueryInterface().dropAllTables()
    .then(function() {
      sequelize.modelManager.daos = [];
      sequelize.models = {};

      return sequelize.getQueryInterface().dropAllEnums();
    }).then(done, done);
  });

  describe('Model#define()', function() {

    describe('options.auditable', function() {
      it('create table by using options.auditable in model define', function() {
        var userModel = sequelize.define('user', {
          username: Sequelize.STRING
        }, {auditable: true});

        expect(userModel.auditModel).to.be.ok;
      });
    });

    describe('#makeAuditable()', function() {
      it('create table by using makeAuditable function', function() {
        var userModel = sequelize.define('user', {username: Sequelize.STRING});
        userModel.makeAuditable();

        expect(userModel.auditModel).to.be.ok;
      });
    });

  });

  describe('Data operation', function() {
    var userModel;

    beforeEach(function(done) {
      userModel = sequelize.define('user', {
        username: Sequelize.STRING,
        flag: { type: Sequelize.BOOLEAN, defaultValue: true}
      }, {auditable: true});

      userModel.sync({force: true}).then(function() {
        return userModel.auditModel.sync({force: true});
      }).then(function() {
        return userModel.bulkCreate([{username: 'test1'}, {username: 'test2'}]);
      }).then(function() {
        done();
      });
    });

    describe('update', function() {
      it('should insert one changed history into audit table', function(done) {
        userModel.findOne({where: {username: 'test1'}}).bind({})
        .then(function(user) {
          this.user = user;
          return user.update({username: 'changed'});
        }).then(function() {
          expect(this.user.username).to.equal('changed');
        }).then(function() {
          return userModel.auditModel.findAll({
            where: {
              username: 'test1',
              recordId: this.user.id,
              action: 'updated'
            }
          });
        }).then(function(histories) {
          expect(histories).to.have.lengthOf(1);
          done();
        });
      });
    });

    describe('bulkUpdate', function() {
      it('should insert bulk changed histories into audit table', function(done) {
        userModel.update({username: 'bulk_changed'}, {where: {flag: true}})
        .then(function(affectedRows) {
          expect(affectedRows[0]).to.equal(2);

          return userModel.auditModel.count({
            where: {username: 'test1', action: 'updated'}
          });
        }).then(function(num) {
          expect(num).to.equal(1);

          return userModel.auditModel.count({
            where: {username: 'test2', action: 'updated'}
          });
        }).then(function(num) {
          expect(num).to.equal(1);
        }).then(done, done);
      });
    });

    describe('destroy', function() {
      it('should insert deleted history into audit table', function(done) {
        userModel.destroy({where: {username: 'test1'}})
        .then(function(affectedRows) {
          expect(affectedRows).to.equal(1);

          return userModel.auditModel.count({
            where: {username: 'test1', action: 'deleted'}
          });
        }).then(function(affectedRows) {
          expect(affectedRows).to.equal(1);
        }).then(done, done);
      });
    });

    describe('bulkDestroy', function() {
      it('should insert bulk deleted histories into audit table', function(done) {
        userModel.destroy({where: {flag: true}})
        .then(function(affectedRows) {
          expect(affectedRows).to.equal(2);

          return userModel.auditModel.count({
            where: {username: 'test1', action: 'deleted'}
          });
        }).then(function(affectedRows) {
          expect(affectedRows).to.equal(1);

          return userModel.auditModel.count({
            where: {username: 'test2', action: 'deleted'}
          });
        }).then(function(affectedRows) {
          expect(affectedRows).to.equal(1);
        }).then(done, done);
      });
    });

    describe('Instance#getHistories()', function() {
      it('should get all histories', function(done) {
        userModel.findOne({where: {username: 'test1'}}).bind({})
        .then(function(user) {
          this.user = user;

          return user.update({username: 'first_change'});
        }).then(function() {
          return this.user.update({username: 'second_change'});
        }).then(function() {
          return userModel.auditModel.findAll({where: {recordId: this.user.id}})
        }).then(function(records) {
          this.records = records;
          return this.user.getHistories();
        }).then(function(histories) {
          expect(this.records.length).to.equal(histories.length);
          done();
        });
      });
    });
  });

});