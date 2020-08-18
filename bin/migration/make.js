


import prettier from 'prettier';

import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import migrate from '../../lib/migrate.js';
import pathConfig from '../../lib/pathConfig.js';

const make = async (argv) => {
  // Windows support
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }

  const { migrationsDir, modelsDir, packageDir } = pathConfig(argv);

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
  } catch (e) { /** Error */}

  // console.log(path.join(migrationsDir, '_current.json'), JSON.parse(fs.readFileSync(path.join(migrationsDir, '_current.json') )))
  const {sequelize} = await import(modelsDir);

  const {models} = sequelize;

  currentState.tables = migrate.reverseModels(sequelize, models);

  const upActions = migrate.parseDifference(
    previousState.tables,
    currentState.tables
  );
  const downActions = migrate.parseDifference(
    currentState.tables,
    previousState.tables
  );

  // sort actions
  migrate.sortActions(upActions);
  migrate.sortActions(downActions);

  const migration = migrate.getMigration(upActions, downActions);

  if (migration.commandsUp.length === 0) {
    console.log('No changes found');
    process.exit(0);
  }

  // log migration actions
  _.each(migration.consoleOut, (v) => {
    console.log(`[Actions] ${  v}`);
  });

  if (argv.preview) {
    console.log('Migration result:');
    console.log(
      prettier.format(`[ \n${  migration.commandsUp.join(', \n')  } \n];\n`, {
        parser: 'babel',
      })
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

  const { type } = await import (packageDir);

  const es6 = argv.es6 == null ? type === 'module' : argv.es6;

  // write migration to file
  const info = migrate.writeMigration(
    currentState.revision,
    migration,
    migrationsDir,
    argv.name ? argv.name : 'noname',
    argv.comment ? argv.comment : '',
    argv.timestamp,
    es6
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
}

export default make;
