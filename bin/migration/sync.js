import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { pathConfig, sortActions } from '../../lib/helpers.js';
import { getMigration } from '../../lib/migration.js';
import { parseDifference, reverseModels } from '../../lib/models.js';

const sync = async (argv) => {
  const { modelsDir, migrationsDir, stateDir, indexDir } = pathConfig(argv);

  if (!fs.existsSync(modelsDir)) {
    console.log("Can't find models directory. Use `sequelize init` to create it");
    return;
  }

  if (!fs.existsSync(migrationsDir)) {
    console.log("Can't find migrations directory. Use `sequelize init` to create it");
    return;
  }

  if (!fs.existsSync(stateDir)) {
    console.log("Can't find State directory. I will make it manually");
    fs.mkdirSync(stateDir, { recursive: true });
  }

  // current state
  const currentState = {
    tables: {},
    path: path.join(stateDir, '_current.json'),
    backupPath: path.join(stateDir, '_current_bak.json'),
  };

  currentState.exists = fs.existsSync(currentState.path);

  // load last state
  let previousState = {
    revision: 0,
    tables: {},
  };

  if (currentState.exists) {
    try {
      previousState = JSON.parse(fs.readFileSync(currentState.path));
    } catch (e) {
      console.log('_current.json syntax not valid');
    }
  } else {
    console.log('_current.json not found. first time running this tool');
  }

  const { sequelize } = (await import(`file:////${indexDir}`)).default;
  const { models } = sequelize;

  currentState.tables = reverseModels(sequelize, models);

  const upActions = parseDifference(previousState.tables, currentState.tables);
  const downActions = parseDifference(currentState.tables, previousState.tables);

  // sort actions
  sortActions(upActions);
  sortActions(downActions);

  const migration = getMigration(upActions, downActions);

  if (migration.commandsUp.length === 0) {
    console.log('No changes found, No new migration needed!');
    return;
  }

  // log migration actions
  migration.consoles.forEach((action, index) => console.log(`[Action #${index}] ${action}`));

  if (argv.preview) {
    console.log('Migration result:');
    console.log(
      prettier.format(`[ \n${migration.commandsUp.join(', \n')} \n];\n`, {
        parser: 'babel',
      }),
    );
    return;
  }

  currentState.revision = previousState.revision + 1;

  // backup _current file
  if (currentState.exists)
    fs.writeFileSync(currentState.backupPath, JSON.stringify(previousState, null, 4));

  // save current state
  fs.writeFileSync(currentState.path, JSON.stringify(currentState, null, 4));

  console.log('Migrations synced successfully');
};

export default sync;
