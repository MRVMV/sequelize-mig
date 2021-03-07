import fs, { writeFileSync } from 'fs';
import path, { join } from 'path';
import prettier from 'prettier';
import { getYYYYMMDDHHMMSS, template, log } from './functions.js';
import { readAsset, sortActions } from './helpers.js';
import { getActions, reverseModels } from './models.js';

export const getPartialMigration = (actions) => {
  const stringifyModel = (obj) => {
    const vals = [];
    Object.entries(obj).forEach(([key, val]) => {
      const x = {};
      if (key === 'seqType') {
        vals.push(`"type": ${val}`);
      } else if (key === 'defaultValue' && val.internal) {
        vals.push(`"defaultValue": ${val.value}`);
      } else if (key === 'defaultValue' && !val.notSupported) {
        x[key] = val.value;
        vals.push(JSON.stringify(x).slice(1, -1));
      } else if (!val.notSupported) {
        x[key] = val;
        vals.push(JSON.stringify(x).slice(1, -1));
      }
    });
    return `{ ${vals.reverse().join(', ')} }`;
  };

  const getAttributes = (attrs) => {
    const ret = [];
    Object.entries(attrs).forEach(([key, val]) => ret.push(`"${key}": ${stringifyModel(val)}`));

    return `{ \n${ret.join(', \n')}\n}`;
  };

  const parseOptions = (options, addTransaction = false) => {
    if (addTransaction) {
      let ret = JSON.stringify({ ...options, transaction: '###TRANSACTION###' });
      ret = ret.replace('"transaction":"###TRANSACTION###"', 'transaction');
      return ret;
    }
    return '{ transaction }';
  };

  const writeCommand = (action, par, addProperty = false, addTransaction = false) => {
    const pars = [`"${action.tableName}"`];

    if (par) {
      if (/^[^{[].*/.test(par)) par = `"${par}"`;
      pars.push(par);
    }

    if (action.actionType === 'renameColumn') {
      pars.push(`"${action.options}"`);
    } else {
      if (addProperty) pars.push(stringifyModel(action.options));
      pars.push(parseOptions(action.options, addTransaction));
    }

    return `{
      fn: "${action.actionType}",
      params: [${pars.join(',')}]
    }`;
  };

  const writeConsole = (action, par = '', showDeps = false) => {
    let ret = `${action.actionType}(${par}) => "${action.tableName}"`;
    if (showDeps) ret += `, deps: [${action.depends.join(', ')}]`;

    return ret;
  };

  const commands = [];
  const consoles = [];

  actions.forEach((action) => {
    let commandPar;
    let consolePar;

    let showDeps = false;
    let addProperty = false;
    let addTransaction = false;

    if (!action.options) action.options = {};

    switch (action.actionType) {
      case 'createTable':
        commandPar = getAttributes(action.attributes);
        showDeps = true;
        addTransaction = true;
        break;

      case 'dropTable':
        showDeps = true;
        break;

      case 'addColumn':
      case 'changeColumn':
        commandPar = action.options.field ? action.options.field : action.attributeName;
        addProperty = true;
        consolePar = commandPar;
        break;

      case 'renameColumn':
      case 'removeColumn':
        commandPar = action.options.field ? action.options.field : action.columnName;
        consolePar = commandPar;
        break;

      case 'addIndex':
        commandPar = JSON.stringify(action.fields);
        consolePar = action.options.indexName
          ? action.options.indexName
          : JSON.stringify(action.fields);
        addTransaction = true;
        break;

      case 'removeIndex':
        commandPar = action.options.indexName
          ? action.options.indexName
          : JSON.stringify(action.fields);
        consolePar = commandPar;
        break;

      default:
        action = null;
        log(4, 'Error: action not specified');
    }

    if (action) {
      commands.push(writeCommand(action, commandPar, addProperty, addTransaction));
      consoles.push(writeConsole(action, consolePar, showDeps));
    }
  });

  return { commands, consoles };
};

export const updateMigrationState = async (currentState, previousState) => {
  // backup _current file
  if (currentState.exists)
    fs.writeFileSync(currentState.backupPath, JSON.stringify(previousState, null, 4));

  // save current state
  currentState.revision = previousState.revision + 1;
  fs.writeFileSync(currentState.path, JSON.stringify(currentState, null, 4));
};

export const getMigration = (upActions, downActions) => {
  const { commands: commandsUp, consoles } = getPartialMigration(upActions);
  const { commands: commandsDown } = getPartialMigration(downActions);
  return { commandsUp, commandsDown, consoles };
};

export const migrate = async (options) => {
  const { modelsDir, migrationsDir, indexDir, stateDir } = options;

  log(1, `migrate options:${JSON.stringify(options, null, 2)}`);

  if (!fs.existsSync(modelsDir))
    throw new Error("Can't find models directory. Use `sequelize init` to create it");

  if (!fs.existsSync(migrationsDir))
    throw new Error("Can't find migrations directory. Use `sequelize init` to create it");

  if (!fs.existsSync(indexDir))
    throw new Error("Can't find sequelize index file. Use `sequelize init` to create it");

  if (!fs.existsSync(stateDir)) {
    log(3, "Can't find State directory. Creating it...");
    fs.mkdirSync(stateDir, { recursive: true });
  }

  // current state
  const newState = {
    tables: {},
    path: path.join(stateDir, '_current.json'),
    backupPath: path.join(stateDir, '_current_bak.json'),
  };

  newState.exists = fs.existsSync(newState.path);

  let oldState = {
    revision: 0,
    tables: {},
  };
  
  if (newState.exists) {
    try {
      oldState = JSON.parse(fs.readFileSync(newState.path));
    } catch (e) {
      log(3, '_current.json syntax is not valid, overriding it');
    }
  } else {
    log(3, '_current.json not found. first time running this tool');
  }

  try {
    const { sequelize } = (await import(`file:\\\\${indexDir}`)).default;
    const { models } = sequelize;

    newState.tables = reverseModels(sequelize, models);
  } catch (e) {
    throw new Error(`sequelize index file is not valid probably. solve it and try again: ${e}`);
  }

  const upActions = await getActions(oldState.tables, newState.tables);
  const downActions = await getActions(newState.tables, oldState.tables, upActions);

  // sort actions
  sortActions(upActions);
  sortActions(downActions);

  const migration = getMigration(upActions, downActions);
  return {
    previousState: oldState,
    currentState: newState,
    migration,
  };
};

export const writeMigration = (
  revision,
  migration,
  migrationsDir,
  name = 'noname',
  comment = '',
  es6 = false,
) => {
  const commandsUp = migration.commandsUp.join(', \n');
  const commandsDown = migration.commandsDown.join(', \n');
  const actions = migration.consoles.join('\n * ');

  const infoObj = {
    revision,
    name,
    created: new Date(),
    comment,
  };

  const info = JSON.stringify(infoObj, null, 4);

  const file = readAsset('migrations/skeleton.js');
  const content = template(file, { actions, info, commandsUp, commandsDown });

  name = name.replace(' ', '_');
  const filename = join(migrationsDir, `${getYYYYMMDDHHMMSS()}_${name}.${es6 ? 'cjs' : 'js'}`);

  writeFileSync(filename, prettier.format(content, { parser: 'babel' }));

  return { filename, info };
};
