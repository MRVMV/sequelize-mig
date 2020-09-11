import { createRequire } from 'module';

import prettier from 'prettier';

import fs from 'fs';
import path from 'path';
import { each } from 'lodash';

import migrate from '../../lib/migrate.js';
import { pathConfig } from '../../lib/functions.js';

const require = createRequire(import.meta.url);

const make = async (argv) => {
  // Windows support
  if (!process.env.PWD) process.env.PWD = process.cwd();

  const { modelsDir, migrationsDir, indexDir, packageDir } = await pathConfig(argv);

  if (!fs.existsSync(modelsDir)) {
    console.log("Can't find models directory. Use `sequelize init` to create it");
    return;
  }

  if (!fs.existsSync(migrationsDir)) {
    console.log("Can't find migrations directory. Use `sequelize init` to create it");
    return;
  }

  // current state
  const currentState = {
    tables: {},
    path: path.join(migrationsDir, '_current.json'),
    backupPath: path.join(migrationsDir, '_current_bak.json'),
  };

  currentState.exists = fs.existsSync(currentState.path);

  // load last state
  let previousState = {
    revision: 0,
    tables: {},
  };

  if (currentState.exists) {
    currentState.content = fs.readFileSync(currentState.path);
    try {
      previousState = JSON.parse(currentState.content);
    } catch (e) {
      console.log('_current.json syntax not valid');
    }
  } else {
    console.log('_current.json not found. first time running this tool');
  }

  // console.log(currentState.path, JSON.parse(currentState.content))
  const { sequelize } = (await import(`file:\\${indexDir}`)).default;
  const { models } = sequelize;

  currentState.tables = migrate.reverseModels(sequelize, models);

  const upActions = migrate.parseDifference(previousState.tables, currentState.tables);
  const downActions = migrate.parseDifference(currentState.tables, previousState.tables);

  // sort actions
  migrate.sortActions(upActions);
  migrate.sortActions(downActions);

  const migration = migrate.getMigration(upActions, downActions);

  if (migration.commandsUp.length === 0) {
    console.log('No changes found');
    return;
  }

  // log migration actions
  each(migration.consoleOut, (action, index) => console.log(`[Action #${index}] ${action}`));

  if (argv.preview) {
    console.log('Migration result:');
    console.log(
      prettier.format(`[ \n${migration.commandsUp.join(', \n')} \n];\n`, {
        parser: 'babel',
      }),
    );
    return;
  }

  // backup _current file
  if (currentState.exists) fs.writeFileSync(currentState.backupPath, currentState.content);

  // save current state
  currentState.revision = previousState.revision + 1;
  fs.writeFileSync(currentState.path, JSON.stringify(currentState, null, 4));

  // eslint-disable-next-line import/no-dynamic-require
  const { type } = require(packageDir);

  // write migration to file
  const info = migrate.writeMigration(
    currentState.revision,
    migration,
    migrationsDir,
    argv.name ? argv.name : 'noname',
    argv.comment ? argv.comment : '',
    argv.timestamp,
    argv.es6 !== null ? argv.es6 : type === 'module',
  );

  console.log(
    `New migration to revision ${currentState.revision} has been saved to file\n'${info.filename}'`,
  );
};

export default make;
