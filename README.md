# sequelize-auditing

## Overview

A plugin for sequelize to store data changed into another table.

## Installation

    cnpm install sequelize-auditing

`sequelize-auditing` is built with Sequelize3+, so we highly recommend to upgrade your Sequelize to 3.0.0+.

## How to Define A Audit Model

    // Now we define a model called user, and make it auditable
    // There are two ways to do so,
    //   1. options in model define
    //   2. makeAuditable(options)
    User.js

    // #1
    var User = sequelize.define('user', {
      username: Sequelize.STRING,
      description: Sequelize.TEXT
    }, {
      auditable: true,
    });

    // or you can
    var User = sequelize.define('user', {
      username: Sequelize.STRING,
      description: Sequelize.TEXT
    });

    User.makeAuditable();

You can pass an optional options object to `makeAuditable` function.

**Params**

| Name | Type | Description |
| ------------ | ------------- | ------------ |
| [options.tableSuffix] | String  | The suffix of new audit table. Defaults to '_history' |
| [options.excludeFields] | Array  | The fields are in original table but not in audit table. Defaults to 'id', 'updatedAt' and 'createdAt' |

## How to work


                update
                  |
                  |
                  |
                  v
    beforeUpdate/beforeBulkUpdate -------------+
                  |                            | action = 'updated'
                  |                            | recordId = this.id
                  v                            v
          +----------------+            +-------------+
          | original table |            | audit table |
          +----------------+            +-------------+
                  ^                            ^
                  |                            | action = 'deleted'
                  |                            | recordId = this.id
    beforeDestroy/beforeBulkDestroy -----------+
                  ^
                  |
                  |
                  |
                destroy

`sequelize-auditing` can help you to maintain history record in your audit table. When you enable audit to a model, it will create audit table based on the model schema and do something as follow:

  1. Get all attributes in original table.

  2. Remove some useless attributes, such as `id(primary key)`, `createdAt`, `updatedAt` and also defined in `options.excludeFields`

  3. Add four new fields in audit define: `action:Enum('updated','deleted')`, `recordId:Int`, `createdAt:Datetime` and `changeLog:Text`

  4. Attach some useful hooks or properties to original Model

## Usage

### Instance#getHistories([options]) -> `Promise.<Array.<Instance>>`

    User.findById(1).then(function(user){
      var histories = user.getHistories();
    });

### Model.auditModel

You can work with this object in the same way that you work with the default Sequelize#Model.

## License

[LICENSE](LICENSE)
