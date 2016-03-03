/*
* @Author: Channer
* @Date:   2016-03-03 15:35:54
* @Last Modified by:   Channer
* @Last Modified time: 2016-03-03 15:35:54
*/

'use strict';

var _ = require('lodash');
var Utils = require('./test_utils');
var Sequelize = Utils.Sequelize;

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var sequelizeVersion = require('sequelize/package.json').version;

console.log('Sequelize version:', sequelizeVersion);


describe('Sequelize-auditing Tests', function () {
  afterEach(function() {
    this.models = Utils.sequelize.models;

    var removeModel = Utils.sequelize.modelManager.removeModel
                      .bind(Utils.sequelize.modelManager);

    _.forIn(this.models, function(model) {
      removeModel(model);
    }.bind(this));
  });

  describe('Model#define()', function() {

    describe('options.auditable', function() {
      it('create table by using options.auditable in model define', function() {
        var userModel = Utils.sequelize.define('user', {
          username: Sequelize.STRING
        }, {auditable: true});

        userModel.sync({force: true});

        expect(userModel.auditModel).to.be.ok;
      });
    });

    describe('#makeAuditable()', function() {
      it('create table by using makeAuditable function', function() {
        var userModel = Utils.sequelize.define('user', {username: Sequelize.STRING});
        userModel.makeAuditable();
        userModel.sync({force: true});

        expect(userModel.auditModel).to.be.ok;
      });
    });

  });

  describe('Data operation', function() {
    var userModel;

    before(function() {
      userModel = Utils.sequelize.define('user', {
        username: Sequelize.STRING,
        flag: { type: Sequelize.BOOLEAN, defaultValue: true}
      }, {auditable: true});
      userModel.sync({force: true});
      userModel.bulkCreate([{username: 'test1'}, {username: 'test2'}]);
    });

    describe('update', function() {
      it('should insert one changed history into audit table', function() {
        userModel.findOne({where: {username: 'test1'}})
        .then(function(user) {
          user.update({username: 'changed'});

          expect(user.username).to.equal('changed');

          return userModel.auditModel.count({
            where: {
              username: 'test1',
              recordId: user.id,
              action: 'updated'
            }
          });
        }).then(function(affectedRows) {
          expect(affectedRows).to.equal(1);
        });
      });
    });

    describe('bulkUpdate', function() {
      it('should insert bulk changed histories into audit table', function() {
        userModel.update({username: 'bulk_changed'}, {where: {flag: true}})
        .then(function(affectedRows) {
          expect(affectedRows).to.equal(2);

          return userModel.auditModel.count({
            where: {username: 'test1', action: 'updated'}
          });
        }).then(function(num) {
          expect(num).to.equal(1);

          return userModel.auditModel.count({
            where: {username: 'test2', action: 'updated'}
          });
        });
      });
    });

    describe('destroy', function() {
      it('should insert deleted history into audit table', function() {
        userModel.destroy({where: {username: 'test1'}})
        .then(function(affectedRows) {
          expect(affectedRows).to.equal(1);

          return userModel.auditModel.count({
            where: {username: 'test1', action: 'deleted'}
          });
        }).then(function(affectedRows) {
          expect(affectedRows).to.equal(1);
        });
      });
    });

    describe('bulkDestroy', function() {
      it('should insert bulk deleted histories into audit table', function() {
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
        });
      });
    });

    describe('Instance#getHistories()', function() {
      it('should get all histories', function() {
        var userIns;
        userModel.findOne({where: {username: 'test1'}})
        .then(function(user) {
          userIns = user;

          user.update({username: 'first_change'});
          user.update({username: 'second_change'});

          return userModel.auditModel.findAll({where: {recordId: userIns.id}})
        }).then(function(records) {
          userIns.getHistories().then(function(histories) {
            expect(records.length).to.equal(histories.length);
          })
        })
      });
    });
  });

});