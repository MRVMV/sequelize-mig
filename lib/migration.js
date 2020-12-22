import fs, { writeFileSync } from 'fs';
import path, { join } from 'path';
import prettier from 'prettier';
import { getYYYYMMDDHHMMSS, template } from './functions.js';
import { readAsset, sortActions } from './helpers.js';
import { parseDifference, reverseModels } from './models.js';

const { log } = console;

export const getPartialMigration = (actions) => {
  const propertyToStr = (obj) => {
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
    Object.entries(attrs).forEach(([key, val]) => {
      ret.push(`"${key}": ${propertyToStr(val)}`);
    });

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

    if (addProperty) pars.push(propertyToStr(action.options));
    pars.push(parseOptions(action.options, addTransaction));

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
        commandPar =
          action.options && action.options.field ? action.options.field : action.attributeName;
        addProperty = true;
        consolePar = commandPar;
        break;

      case 'removeColumn':
        commandPar =
          action.options && action.options.field ? action.options.field : action.columnName;
        consolePar = commandPar;
        break;

      case 'addIndex':
        commandPar = JSON.stringify(action.fields);
        consolePar =
          action.options && action.options.indexName
            ? action.options.indexName
            : JSON.stringify(action.fields);
        addTransaction = true;
        break;

      case 'removeIndex':
        commandPar =
          action.options && action.options.indexName
            ? action.options.indexName
            : JSON.stringify(action.fields);
        consolePar = commandPar;
        break;

      default:
        action = null;
        log('Error: action not specified');
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
  const { modelsDir, migrationsDir, stateDir, indexDir } = options;

  if (!fs.existsSync(modelsDir)) {
    throw new Error("Can't find models directory. Use `sequelize init` to create it");
  }

  if (!fs.existsSync(migrationsDir)) {
    throw new Error("Can't find migrations directory. Use `sequelize init` to create it");
  }

  if (!fs.existsSync(stateDir)) {
    console.log("Can't find State directory. Creating it...");
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
  return {
    previousState,
    currentState,
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
