import { writeFileSync } from 'fs';
import { join } from 'path';

import prettier from 'prettier';

import { getYYYYMMDDHHMMSS, template } from './functions.js';
import { readAsset } from './helpers.js';

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
        log('Error: action not specified');
    }

    if (action) {
      commands.push(writeCommand(action, commandPar, addProperty, addTransaction));
      consoles.push(writeConsole(action, consolePar, showDeps));
    }
  });

  return { commands, consoles };
};

export const getMigration = (upActions, downActions) => {
  const { commands: commandsUp, consoles } = getPartialMigration(upActions);
  const { commands: commandsDown } = getPartialMigration(downActions);
  return { commandsUp, commandsDown, consoles };
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
