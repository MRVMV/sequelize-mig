/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-continue */
import { writeFileSync } from 'fs';
import { join } from 'path';
import lodash from 'lodash';

import prettier from 'prettier';

import { readAsset, getYYYYMMDDHHMMSS } from './functions.js';

const { template } = lodash;

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
      } else {
        x[key] = val;
        vals.push(JSON.stringify(x).slice(1, -1));
      }
    });    
    return `{ ${vals.reverse().join(', ')} }`;
  };

  const getAttributes = (attrs) => {
    const ret = [];
    Object.entries(attrs).forEach(([key, val]) => {
      ret.push(`      "${key}": ${propertyToStr(val)}`);
    });

    return `{ \n${ret.join(', \n')}\n     }`;
  };

  const addTransactionToOptions = (options) => {
    let ret = JSON.stringify({ ...options, transaction: '###TRANSACTION###' });
    ret = ret.replace('"transaction":"###TRANSACTION###"', 'transaction');
    return ret;
  };
  const writeAction = (action, pars = []) => {
    pars = [
      action.tableName,
      ...pars,
      action.options ? addTransactionToOptions(action.options) : '{ transaction }',
    ];
    let params = '';
    for (const par of pars) {
      if (typeof par === 'string' && par.substring(0, 1) !== '{' && par.substring(0, 1) !== '[')
        params += `"${par}",`;
      else params += `${par},`;
    }
    params = params.slice(0, -1);
    return `{
      fn: "${action.actionType}",
      params: [
        ${params}
      ]
    }`;
  };

  const writeConsoleOut = (action, pars = [], showDeps = false) => {
    const deps = showDeps ? `, deps: [${action.depends.join(', ')}]` : '';
    const params = pars.length > 0 ? `(${pars.join(', ')})` : '';

    return `${action.actionType}${params} => "${action.tableName}"${deps}`;
  };

  const commands = [];
  const consoleOut = [];
  let res;
  let nameOrAttrs;

  for (const i in actions) {
    const action = actions[i];
    switch (action.actionType) {
      case 'createTable':
        res = writeAction(action, [getAttributes(action.attributes)]);
        commands.push(res);

        consoleOut.push(writeConsoleOut(action));
        break;

      case 'dropTable':
        res = writeAction(action);
        commands.push(res);

        consoleOut.push(writeConsoleOut(action));
        break;

      case 'addColumn':
        res = writeAction(action, [
          action.options && action.options.field ? action.options.field : action.attributeName,
          propertyToStr(action.options),
        ]);
        commands.push(res);

        consoleOut.push(writeConsoleOut(action, [action.attributeName]));
        break;

      case 'removeColumn':
        res = writeAction(action, [
          action.options && action.options.field ? action.options.field : action.columnName,
        ]);
        commands.push(res);

        consoleOut.push(
          writeConsoleOut(action, [
            action.options && action.options.field ? action.options.field : action.columnName,
          ]),
        );
        break;

      case 'changeColumn':
        res = writeAction(action, [
          action.options && action.options.field ? action.options.field : action.attributeName,
          propertyToStr(action.options),
        ]);
        commands.push(res);

        consoleOut.push(writeConsoleOut(action, [action.attributeName]));
        break;

      case 'addIndex':
        nameOrAttrs =
          action.options && action.options.indexName
            ? `"${action.options.indexName}"`
            : JSON.stringify(action.fields);

        res = writeAction(action, [JSON.stringify(action.fields)]);
        commands.push(res);

        consoleOut.push(writeConsoleOut(action, [nameOrAttrs]));
        break;

      case 'removeIndex':
        nameOrAttrs =
          action.options && action.options.indexName
            ? `"${action.options.indexName}"`
            : JSON.stringify(action.fields);

        res = writeAction(action, [nameOrAttrs]);
        commands.push(res);

        consoleOut.push(writeConsoleOut(action, [nameOrAttrs]));
        break;

      default:
        log('Error: action not specified');
    }
  }

  return { commands, consoleOut };
};

export const getMigration = (upActions, downActions) => {
  const { commands: commandsUp, consoleOut } = getPartialMigration(upActions);
  const { commands: commandsDown } = getPartialMigration(downActions);
  return { commandsUp, commandsDown, consoleOut };
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
  const actions = migration.consoleOut.join('\n * ');

  const infoObj = {
    revision,
    name,
    created: new Date(),
    comment,
  };

  const info = JSON.stringify(infoObj, null, 4);

  const file = readAsset('migrations/skeleton.js');
  const content = template(file)({ actions, info, commandsUp, commandsDown });

  name = name.replace(' ', '_');
  const filename = join(migrationsDir, `${getYYYYMMDDHHMMSS()}_${name}.${es6 ? 'cjs' : 'js'}`);

  writeFileSync(filename, prettier.format(content, { parser: 'babel' }));

  return { filename, info };
};
