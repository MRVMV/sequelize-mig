"use strict";

const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable => "country", deps: []
 * createTable => "geos", deps: []
 * createTable => "purchaseProducts", deps: []
 * createTable => "city", deps: [country]
 * createTable => "account", deps: [city]
 * addIndex(city_latitude) => "city"
 * addIndex(country_display) => "country"
 *
 */

const info = {
  revision: 1,
  name: "Try",
  created: "2020-10-28T19:28:36.117Z",
  comment: "",
};

const migrationCommands = (transaction) => {
  return [
    {
      fn: "createTable",
      params: [
        "country",
        {
          id: {
            type: Sequelize.INTEGER,
            field: "id",
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          title: { type: Sequelize.STRING, field: "title", allowNull: false },
          display: {
            type: Sequelize.BOOLEAN,
            field: "display",
            defaultValue: true,
            allowNull: false,
          },
        },
        { transaction },
      ],
    },
    {
      fn: "createTable",
      params: [
        "geos",
        {
          id: {
            type: Sequelize.INTEGER,
            field: "id",
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          geometry_1: {
            type: Sequelize.GEOMETRY,
            field: "geometry_1",
            allowNull: false,
          },
          geometry_2: {
            type: Sequelize.GEOMETRY("POINT"),
            field: "geometry_2",
            allowNull: false,
          },
          geometry_3: {
            type: Sequelize.GEOMETRY("POINT", 4326),
            field: "geometry_3",
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            field: "createdAt",
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DATE,
            field: "updatedAt",
            allowNull: false,
          },
        },
        { transaction },
      ],
    },
    {
      fn: "createTable",
      params: [
        "purchaseProducts",
        {
          id: {
            type: Sequelize.INTEGER.UNSIGNED,
            field: "id",
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          price: {
            type: Sequelize.DECIMAL(6, 2),
            field: "price",
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            field: "createdAt",
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DATE,
            field: "updatedAt",
            allowNull: false,
          },
        },
        { transaction },
      ],
    },
    {
      fn: "createTable",
      params: [
        "city",
        {
          id: {
            type: Sequelize.INTEGER,
            field: "id",
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          title: { type: Sequelize.STRING, field: "title", allowNull: false },
          display: {
            type: Sequelize.BOOLEAN,
            field: "display",
            defaultValue: true,
            allowNull: false,
          },
          latitude: {
            type: Sequelize.DOUBLE,
            field: "latitude",
            allowNull: true,
          },
          countryId: {
            type: Sequelize.INTEGER,
            field: "country_id",
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            references: { model: "country", key: "id" },
            allowNull: true,
          },
        },
        { transaction },
      ],
    },
    {
      fn: "createTable",
      params: [
        "account",
        {
          id: {
            type: Sequelize.INTEGER.UNSIGNED,
            field: "id",
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          budget: {
            type: Sequelize.DECIMAL(6, 2),
            field: "budget",
            allowNull: false,
          },
          test_param: {
            type: Sequelize.BIGINT,
            field: "test_param",
            defaultValue: 1000,
            allowNull: false,
          },
          first_name: {
            type: Sequelize.STRING,
            field: "first-name",
            defaultValue: "abc",
            allowNull: true,
          },
          last_name: {
            type: Sequelize.STRING,
            field: "last_name",
            defaultValue: "",
            allowNull: false,
          },
          nickname: {
            type: Sequelize.STRING,
            field: "nickname",
            defaultValue: "",
            allowNull: false,
          },
          gender: {
            type: Sequelize.ENUM("male", "female", "unknown"),
            field: "gender",
            defaultValue: "unknown",
            allowNull: false,
          },
          birth_date: {
            type: Sequelize.DATEONLY,
            field: "birth_date",
            allowNull: true,
          },
          last_login_dt: {
            type: Sequelize.DATE,
            field: "last_login_dt",
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            field: "created_at",
            defaultValue: Sequelize.NOW,
            allowNull: true,
          },
          email: { type: Sequelize.STRING, field: "email", allowNull: false },
          password: {
            type: Sequelize.STRING,
            field: "password",
            allowNull: false,
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            field: "is_deleted",
            defaultValue: false,
            allowNull: false,
          },
          is_blocked: {
            type: Sequelize.BOOLEAN,
            field: "is_blocked",
            defaultValue: false,
            allowNull: false,
          },
          cityId: {
            type: Sequelize.INTEGER,
            field: "city_id",
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            references: { model: "city", key: "id" },
            allowNull: true,
          },
        },
        { transaction },
      ],
    },
    {
      fn: "addIndex",
      params: [
        "city",
        ["latitude"],
        { indexName: "city_latitude", name: "city_latitude", transaction },
      ],
    },
    {
      fn: "addIndex",
      params: [
        "country",
        ["display"],
        { indexName: "country_display", name: "country_display", transaction },
      ],
    },
  ];
};

const rollbackCommands = (transaction) => {
  return [
    {
      fn: "dropTable",
      params: ["account", { transaction }],
    },
    {
      fn: "dropTable",
      params: ["city", { transaction }],
    },
    {
      fn: "dropTable",
      params: ["country", { transaction }],
    },
    {
      fn: "dropTable",
      params: ["geos", { transaction }],
    },
    {
      fn: "dropTable",
      params: ["purchaseProducts", { transaction }],
    },
  ];
};

const pos = 0;
const useTransaction = true;

const execute = (queryInterface, sequelize, _commands) => {
  let index = pos;
  const run = (transaction) => {
    const commands = _commands(transaction);
    return new Promise((resolve, reject) => {
      const next = () => {
        if (index < commands.length) {
          const command = commands[index];
          console.log(`[#${index}] execute: ${command.fn}`);
          index++;
          queryInterface[command.fn](...command.params).then(next, reject);
        } else resolve();
      };
      next();
    });
  };
  if (this.useTransaction) {
    return queryInterface.sequelize.transaction(run);
  }
  return run(null);
};

module.exports = {
  pos,
  useTransaction,
  up: (queryInterface, sequelize) => {
    return execute(queryInterface, sequelize, migrationCommands);
  },
  down: (queryInterface, sequelize) => {
    return execute(queryInterface, sequelize, rollbackCommands);
  },
  info,
};
