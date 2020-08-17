#!/usr/bin/env node

// const beautify = require('js-beautify').js_beautify;

let migrate = require('../../lib/migrate');
let pathConfig = require('../../lib/pathconfig');

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const methods = {};

methods.make = (argv) => {
  console.log(`Make Action ${JSON.stringify(argv)}`);

  // Windows support
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }

  const { migrationsDir, modelsDir } = pathConfig(argv);

  if (!fs.existsSync(modelsDir)) {
    console.log(
      "Can't find models directory. Use `sequelize init` to create it"
    );
    return;
  }

  if (!fs.existsSync(migrationsDir)) {
    console.log(
      "Can't find migrations directory. Use `sequelize init` to create it"
    );
    return;
  }

  // current state
  const currentState = {
    tables: {},
  };

  // load last state
  let previousState = {
    revision: 0,
    version: 1,
    tables: {},
  };

  try {
    previousState = JSON.parse(
      fs.readFileSync(path.join(migrationsDir, '_current.json'))
    );
  } catch (e) {}

  //console.log(path.join(migrationsDir, '_current.json'), JSON.parse(fs.readFileSync(path.join(migrationsDir, '_current.json') )))
  let sequelize = require(modelsDir).sequelize;

  let models = sequelize.models;

  currentState.tables = migrate.reverseModels(sequelize, models);

  let upActions = migrate.parseDifference(
    previousState.tables,
    currentState.tables
  );
  let downActions = migrate.parseDifference(
    currentState.tables,
    previousState.tables
  );

  // sort actions
  migrate.sortActions(upActions);
  migrate.sortActions(downActions);

  let migration = migrate.getMigration(upActions, downActions);

  if (migration.commandsUp.length === 0) {
    console.log('No changes found');
    process.exit(0);
  }

  // log migration actions
  _.each(migration.consoleOut, (v) => {
    console.log('[Actions] ' + v);
  });

  if (argv.preview) {
    console.log('Migration result:');
    console.log(
      beautify('[ \n' + migration.commandsUp.join(', \n') + ' \n];\n')
    );
    process.exit(0);
  }

  // backup _current file
  if (fs.existsSync(path.join(migrationsDir, '_current.json')))
    fs.writeFileSync(
      path.join(migrationsDir, '_current_bak.json'),
      fs.readFileSync(path.join(migrationsDir, '_current.json'))
    );

  // save current state
  currentState.revision = previousState.revision + 1;
  fs.writeFileSync(
    path.join(migrationsDir, '_current.json'),
    JSON.stringify(currentState, null, 4)
  );

  // write migration to file
  let info = migrate.writeMigration(
    currentState.revision,
    migration,
    migrationsDir,
    argv.name ? argv.name : 'noname',
    argv.comment ? argv.comment : '',
    argv.timestamp,
    argv.es6
  );

  console.log(
    `New migration to revision ${currentState.revision} has been saved to file '${info.filename}'`
  );

  if (argv.execute) {
    migrate.executeMigration(
      sequelize.getQueryInterface(),
      info.filename,
      true,
      0,
      false,
      (err) => {
        if (!err) console.log('Migration has been executed successfully');
        else console.log('Errors, during migration execution', err);
        process.exit(0);
      }
    );
  } else process.exit(0);
};
module.exports = methods;
