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

  const addTransactionToOptions = (options) => {
    let ret = JSON.stringify({ ...options, transaction: '###TRANSACTION###' });
    ret = ret.replace('"transaction":"###TRANSACTION###"', 'transaction');
    return ret;
  };

  const writeCommand = (action, pars = []) => {
    pars = [
      action.tableName,
      ...pars,
      action.options ? addTransactionToOptions(action.options) : '{ transaction }',
    ];
    let params = '';
    pars.forEach((par) => {
      if (typeof par === 'string' && !['{', '['].includes(par.substring(0, 1)))
        params += `"${par}",`;
      else params += `${par},`;
    });
    params = params.slice(0, -1);
    return `{
      fn: "${action.actionType}",
      params: [
        ${params}
      ]
    }`;
  };

  const writeConsole = (action, pars = [], showDeps = false) => {
    const deps = showDeps ? `, deps: [${action.depends.join(', ')}]` : '';
    const params = pars.length > 0 ? `(${pars.join(', ')})` : '';

    return `${action.actionType}${params} => "${action.tableName}"${deps}`;
  };

  const commands = [];
  const consoles = [];

  actions.forEach((action) => {
    let commandPars = [];
    let consolePars = [];
    let showDeps = false;

    switch (action.actionType) {
      case 'createTable':
        commandPars = [getAttributes(action.attributes)];
        showDeps = true;
        break;

      case 'dropTable':
        showDeps = true;
        break;

      case 'addColumn':
      case 'changeColumn':
        commandPars = [
          action.options && action.options.field ? action.options.field : action.attributeName,
          propertyToStr(action.options),
        ];
        consolePars = [action.attributeName];
        break;

      case 'removeColumn':
        commandPars = [
          action.options && action.options.field ? action.options.field : action.columnName,
        ];
        consolePars = commandPars;
        break;

      case 'addIndex':
        commandPars = [JSON.stringify(action.fields)];
        consolePars = [
          action.options && action.options.indexName
            ? action.options.indexName
            : JSON.stringify(action.fields),
        ];
        break;

      case 'removeIndex':
        commandPars = [
          action.options && action.options.indexName
            ? action.options.indexName
            : JSON.stringify(action.fields),
        ];
        consolePars = commandPars;
        break;

      default:
        action = null;
        log('Error: action not specified');
    }

    if (action) {
      commands.push(writeCommand(action, commandPars));
      consoles.push(writeConsole(action, consolePars, showDeps));
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
