'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "country", deps: []
 * createTable "geos", deps: []
 * createTable "purchaseProducts", deps: []
 * createTable "city", deps: [country]
 * createTable "account", deps: [city]
 * addIndex "city_country_id" to table "city"
 * addIndex "city_title" to table "city"
 * addIndex "country_title" to table "country"
 * addIndex "country_display" to table "country"
 *
 **/

var info = {
    "revision": 1,
    "name": "noname",
    "created": "2020-08-14T23:42:49.978Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "country",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "title": {
                        "type": Sequelize.STRING,
                        "field": "title",
                        "allowNull": false
                    },
                    "display": {
                        "type": Sequelize.BOOLEAN,
                        "field": "display",
                        "defaultValue": true,
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "geos",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "geometry_1": {
                        "type": Sequelize.GEOMETRY,
                        "field": "geometry_1",
                        "allowNull": false
                    },
                    "geometry_2": {
                        "type": Sequelize.GEOMETRY('POINT'),
                        "field": "geometry_2",
                        "allowNull": false
                    },
                    "geometry_3": {
                        "type": Sequelize.GEOMETRY('POINT', 4326),
                        "field": "geometry_3",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "purchaseProducts",
                {
                    "id": {
                        "type": Sequelize.INTEGER.UNSIGNED,
                        "field": "id",
                        "primaryKey": true,
                        "autoIncrement": true,
                        "allowNull": false
                    },
                    "price": {
                        "type": Sequelize.DECIMAL(6, 2),
                        "field": "price",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "city",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "title": {
                        "type": Sequelize.STRING,
                        "field": "title",
                        "allowNull": false
                    },
                    "display": {
                        "type": Sequelize.BOOLEAN,
                        "field": "display",
                        "defaultValue": true,
                        "allowNull": false
                    },
                    "countryId": {
                        "type": Sequelize.INTEGER,
                        "field": "country_id",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "country",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "account",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "test_param": {
                        "type": Sequelize.BIGINT,
                        "field": "test_param",
                        "defaultValue": 1000,
                        "allowNull": false
                    },
                    "first_name": {
                        "type": Sequelize.STRING,
                        "field": "first-name",
                        "defaultValue": "abc",
                        "allowNull": true
                    },
                    "last_name": {
                        "type": Sequelize.STRING,
                        "field": "last_name",
                        "defaultValue": "",
                        "allowNull": false
                    },
                    "nickname": {
                        "type": Sequelize.STRING,
                        "field": "nickname",
                        "defaultValue": "",
                        "allowNull": false
                    },
                    "gender": {
                        "type": Sequelize.ENUM('male', 'female', 'unknown'),
                        "field": "gender",
                        "defaultValue": "unknown",
                        "allowNull": false
                    },
                    "birth_date": {
                        "type": Sequelize.DATEONLY,
                        "field": "birth_date",
                        "allowNull": true
                    },
                    "last_login_dt": {
                        "type": Sequelize.DATE,
                        "field": "last_login_dt",
                        "allowNull": true
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "defaultValue": Sequelize.NOW,
                        "allowNull": true
                    },
                    "email": {
                        "type": Sequelize.STRING,
                        "field": "email",
                        "allowNull": false
                    },
                    "password": {
                        "type": Sequelize.STRING,
                        "field": "password",
                        "allowNull": false
                    },
                    "is_deleted": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_deleted",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "is_blocked": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_blocked",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "cityId": {
                        "type": Sequelize.INTEGER,
                        "field": "city_id",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "city",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "city",
                ["country_id"],
                {
                    "indexName": "city_country_id",
                    "name": "city_country_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "city",
                ["title"],
                {
                    "indexName": "city_title",
                    "name": "city_title",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "country",
                ["title"],
                {
                    "indexName": "country_title",
                    "name": "country_title",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "country",
                ["display"],
                {
                    "indexName": "country_display",
                    "name": "country_display",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: ["account", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["city", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["country", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["geos", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["purchaseProducts", {
                transaction: transaction
            }]
        }
    ];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
                }
                next();
            });
        }
        if (this.useTransaction) {
            return queryInterface.sequelize.transaction(run);
        } else {
            return run(null);
        }
    },
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
