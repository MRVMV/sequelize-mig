/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-continue */
import Sequelize from 'sequelize';
import hash from 'object-hash';
import lodash from 'lodash';
import deepDiff from 'deep-diff';

import prettier from 'prettier';

import { writeFileSync } from 'fs';
import { join } from 'path';

import { readAsset } from './functions.js';

const { DataTypes: _DataTypes, ARRAY } = Sequelize;
const { each, extend, clone, isEqual, template } = lodash;
const { diff } = deepDiff;

const { log } = console;

const reverseSequelizeColType = (col, prefix = 'Sequelize.') => {
  const attrName = col.type.key;
  const attrObj = col.type;
  const options = col.type.options ? col.type.options : {};
  const DataTypes = _DataTypes;

  switch (attrName) {
    // CHAR(length, binary)
    case DataTypes.CHAR.key:
      if (options.binary) return `${prefix}CHAR.BINARY`;
      return `${prefix}CHAR(${options.length})`;

    // STRING(length, binary).BINARY
    case DataTypes.STRING.key:
      return `${prefix}STRING${options.length ? `(${options.length})` : ''}${
        options.binary ? '.BINARY' : ''
      }`;

    // TEXT(length)
    case DataTypes.TEXT.key:
      if (!options.length) return `${prefix}TEXT`;
      return `${prefix}TEXT(${options.length.toLowerCase()})`;

    // NUMBER(length, decimals).UNSIGNED.ZEROFILL
    case DataTypes.NUMBER.key:
    case DataTypes.TINYINT.key:
    case DataTypes.SMALLINT.key:
    case DataTypes.MEDIUMINT.key:
    case DataTypes.BIGINT.key:
    case DataTypes.FLOAT.key:
    case DataTypes.REAL.key:
    case DataTypes.DOUBLE.key:
    case DataTypes.DECIMAL.key:
    case DataTypes.INTEGER.key: {
      let ret = attrName;
      if (options.length) {
        ret += `(${options.length}`;
        if (options.decimals) ret += `, ${options.decimals}`;
        ret += ')';
      }

      if (options.precision) {
        ret += `(${options.precision}`;
        if (options.scale) ret += `, ${options.scale}`;
        ret += ')';
      }

      ret = [ret];

      if (options.zerofill) ret.push('ZEROFILL');

      if (options.unsigned) ret.push('UNSIGNED');

      return prefix + ret.join('.');
    }

    case DataTypes.ENUM.key:
      return `${prefix}ENUM('${options.values.join("', '")}')`;

    case DataTypes.BLOB.key:
      if (!options.length) return `${prefix}BLOB`;
      return `${prefix}BLOB(${options.length.toLowerCase()})`;

    case DataTypes.GEOMETRY.key:
      if (options.type) {
        if (options.srid) return `${prefix}GEOMETRY('${options.type}', ${options.srid})`;
        return `${prefix}GEOMETRY('${options.type}')`;
      }
      return `${prefix}GEOMETRY`;

    case DataTypes.GEOGRAPHY.key:
      return `${prefix}GEOGRAPHY`;

    case DataTypes.ARRAY.key: {
      const type = attrObj.toString();
      let arrayType;
      if (type === 'INTEGER[]' || type === 'STRING[]') {
        arrayType = prefix + type.replace('[]', '');
      } else {
        arrayType =
          col.seqType === 'Sequelize.ARRAY(Sequelize.INTEGER)'
            ? `${prefix}INTEGER`
            : `${prefix}STRING`;
      }
      return `${prefix}ARRAY(${arrayType})`;
    }
    case DataTypes.RANGE.key:
      console.warn(`${attrName} type not supported, you should make it by`);
      return prefix + attrObj.toSql();

    // BOOLEAN, TIME, DATE, DATEONLY, HSTORE, JSONB
    // UUID, UUIDV1, UUIDV4, VIRTUAL, INET, MACADDR
    default:
      return prefix + attrName;
  }
};

const reverseSequelizeDefValueType = (defaultValue, prefix = 'Sequelize.') => {
  if (typeof defaultValue === 'object') {
    if (defaultValue.constructor && defaultValue.constructor.name) {
      return { internal: true, value: prefix + defaultValue.constructor.name };
    }
  }

  if (typeof defaultValue === 'function') return { notSupported: true, value: '' };

  return { value: defaultValue };
};

const parseIndex = (idx) => {
  delete idx.parser;
  if (idx.type === '') delete idx.type;

  const options = {};

  if (idx.name) {
    options.indexName = idx.name;
    options.name = idx.name; // The name of the index. Default is __
  }
  // @todo: UNIQUE|FULLTEXT|SPATIAL
  if (idx.unique) {
    options.indicesType = 'UNIQUE';
    options.type = 'UNIQUE';
  }

  if (idx.method) options.indexType = idx.type; // Set a type for the index, e.g. BTREE. See the documentation of the used dialect

  if (idx.parser && idx.parser !== '') options.parser = idx.parser; // For FULLTEXT columns set your parser

  idx.options = options;

  idx.hash = hash(idx);

  //    log ('PI:', JSON.stringify(idx, null, 4));
  return idx;
};

const reverseModels = (sequelize, models) => {
  const tables = {};

  delete models.default;

  for (const model in models) {
    const attributes = models[model].attributes || models[model].rawAttributes;

    for (const column in attributes) {
      delete attributes[column].Model;
      delete attributes[column].fieldName;
      // delete attributes[column].field;

      for (const property in attributes[column]) {
        if (property.startsWith('_')) {
          delete attributes[column][property];
          continue;
        }

        if (property === 'defaultValue') {
          const val = reverseSequelizeDefValueType(attributes[column][property]);
          if (val.notSupported) {
            log(`[Not supported] Skip defaultValue column of attribute ${model}:${column}`);
            delete attributes[column][property];
            continue;
          }
          attributes[column][property] = val;
        }

        if (property === 'validate') {
          delete attributes[column][property];
        }

        // remove getters, setters...
        if (typeof attributes[column][property] === 'function') delete attributes[column][property];
      }

      if (typeof attributes[column].type === 'undefined') {
        if (!attributes[column].seqType) {
          log(`[Not supported] Skip column with undefined type ${model}:${column}`);
          delete attributes[column];
          continue;
        } else {
          if (
            !['Sequelize.ARRAY(Sequelize.INTEGER)', 'Sequelize.ARRAY(Sequelize.STRING)'].includes(
              attributes[column].seqType,
            )
          ) {
            delete attributes[column];
            continue;
          }
          attributes[column].type = {
            key: ARRAY.key,
          };
        }
      }

      let seqType = reverseSequelizeColType(attributes[column]);

      // NO virtual types in migration
      if (seqType === 'Sequelize.VIRTUAL') {
        log(`[SKIP] Skip Sequelize.VIRTUAL column "${column}"", defined in model "${model}"`);
        delete attributes[column];
        continue;
      }

      if (!seqType) {
        if (
          typeof attributes[column].type.options !== 'undefined' &&
          typeof attributes[column].type.options.toString === 'function'
        )
          seqType = attributes[column].type.options.toString(sequelize);

        if (typeof attributes[column].type.toString === 'function')
          seqType = attributes[column].type.toString(sequelize);
      }

      attributes[column].seqType = seqType;

      delete attributes[column].type;
      delete attributes[column].values; // ENUM
    }

    tables[models[model].tableName] = {
      tableName: models[model].tableName,
      schema: attributes,
    };

    if (models[model].options.indexes.length > 0) {
      const idxOut = {};
      for (const i in models[model].options.indexes) {
        const index = parseIndex(models[model].options.indexes[i]);
        idxOut[`${index.hash}`] = index;
        delete index.hash;

        // make it immutable
        Object.freeze(index);
      }
      models[model].options.indexes = idxOut;
    }

    if (typeof models[model].options.charset !== 'undefined') {
      tables[models[model].tableName].charset = models[model].options.charset;
    }

    tables[models[model].tableName].indexes = models[model].options.indexes;
  }

  return tables;
};

const parseDifference = (previousState, currentState) => {
  //    log(JSON.stringify(currentState, null, 4));
  const actions = [];
  const difference = diff(previousState, currentState);

  for (const d in difference) {
    const df = difference[d];
    //    log (JSON.stringify(df, null, 4));
    switch (df.kind) {
      // add new
      case 'N':
        {
          // new table created
          if (df.path.length === 1) {
            const depends = [];
            const { tableName } = df.rhs;
            each(df.rhs.schema, (v) => {
              if (v.references) depends.push(v.references.model);
            });

            const options = {};
            if (typeof df.rhs.charset !== 'undefined') {
              options.charset = df.rhs.charset;
            }

            actions.push({
              actionType: 'createTable',
              tableName,
              attributes: df.rhs.schema,
              options,
              depends,
            });

            // create indexes
            if (df.rhs.indexes)
              for (const i in df.rhs.indexes) {
                actions.push(
                  extend(
                    {
                      actionType: 'addIndex',
                      tableName,
                      depends: [tableName],
                    },
                    clone(df.rhs.indexes[i]),
                  ),
                );
              }
            break;
          }

          const tableName = df.path[0];
          const depends = [tableName];

          if (df.path[1] === 'schema') {
            // if (df.path.length === 3) - new field
            if (df.path.length === 3) {
              // new field
              if (df.rhs && df.rhs.references) depends.push(df.rhs.references.model);

              actions.push({
                actionType: 'addColumn',
                tableName,
                attributeName: df.path[2],
                options: df.rhs,
                depends,
              });
              break;
            }

            // if (df.path.length > 3) - add new attribute to column (change col)
            if (df.path.length > 3) {
              if (df.path[1] === 'schema') {
                // new field attributes
                const options = currentState[tableName].schema[df.path[2]];
                if (options.references) depends.push(options.references.nodel);

                actions.push({
                  actionType: 'changeColumn',
                  tableName,
                  attributeName: df.path[2],
                  options,
                  depends,
                });
                break;
              }
            }
          }

          // new index
          if (df.path[1] === 'indexes') {
            const index = clone(df.rhs);
            index.actionType = 'addIndex';
            index.tableName = tableName;
            index.depends = [tableName];
            actions.push(index);
            break;
          }
        }
        break;

      // drop
      case 'D':
        {
          const tableName = df.path[0];
          const depends = [tableName];

          if (df.path.length === 1) {
            // drop table
            actions.push({
              actionType: 'dropTable',
              tableName,
              depends: [],
            });
            break;
          }

          if (df.path[1] === 'schema') {
            // if (df.path.length === 3) - drop field
            if (df.path.length === 3) {
              // drop column
              actions.push({
                actionType: 'removeColumn',
                tableName,
                columnName: df.path[2],
                depends: [tableName],
                options: df.lhs,
              });
              break;
            }

            // if (df.path.length > 3) - drop attribute from column (change col)
            if (df.path.length > 3) {
              // new field attributes
              const options = currentState[tableName].schema[df.path[2]];
              if (options.references) depends.push(options.references.nodel);

              actions.push({
                actionType: 'changeColumn',
                tableName,
                attributeName: df.path[2],
                options,
                depends,
              });
              break;
            }
          }

          if (df.path[1] === 'indexes') {
            //                    log(df)
            actions.push({
              actionType: 'removeIndex',
              tableName,
              fields: df.lhs.fields,
              options: df.lhs.options,
              depends: [tableName],
            });
            break;
          }
        }
        break;

      // edit
      case 'E':
        {
          const tableName = df.path[0];
          const depends = [tableName];

          if (df.path[1] === 'schema') {
            // new field attributes
            const options = currentState[tableName].schema[df.path[2]];
            if (options.references) depends.push(options.references.nodel);

            actions.push({
              actionType: 'changeColumn',
              tableName,
              attributeName: df.path[2],
              options,
              depends,
            });
          }

          // updated index
          // only support updating and dropping indexes
          if (df.path[1] === 'indexes') {
            let keys = Object.keys(df.rhs);

            for (const k in keys) {
              const key = keys[k];
              // const index = clone(df.rhs[key]);
              actions.push({
                actionType: 'addIndex',
                tableName,
                fields: df.rhs[key].fields,
                options: df.rhs[key].options,
                depends: [tableName],
              });
              break;
            }

            keys = Object.keys(df.lhs);
            for (const k in keys) {
              const key = keys[k];
              // const index = clone(df.lhs[key]);
              actions.push({
                actionType: 'removeIndex',
                tableName,
                fields: df.lhs[key].fields,
                options: df.lhs[key].options,
                depends: [tableName],
              });
              break;
            }
          }
        }
        break;

      // array change indexes
      case 'A':
        log(
          '[Not supported] Array model changes! Problems are possible. Please, check result more carefully!',
        );
        log('[Not supported] Difference: ');
        log(JSON.stringify(df, null, 4));
        break;

      default:
        // code
        break;
    }
  }
  return actions;
};

const sortActions = (actions) => {
  const orderedActionTypes = [
    'removeIndex',
    'removeColumn',
    'dropTable',
    'createTable',
    'addColumn',
    'changeColumn',
    'addIndex',
  ];

  // test
  // actions = shuffleArray(actions);

  actions.sort((a, b) => {
    if (orderedActionTypes.indexOf(a.actionType) < orderedActionTypes.indexOf(b.actionType))
      return -1;
    if (orderedActionTypes.indexOf(a.actionType) > orderedActionTypes.indexOf(b.actionType))
      return 1;

    if (a.depends.length === 0 && b.depends.length > 0) return -1; // a < b
    if (b.depends.length === 0 && a.depends.length > 0) return 1; // b < a

    return 0;
  });

  // sort dependencies
  for (let k = 0; k <= actions.length; k++)
    for (let i = 0; i < actions.length; i++) {
      if (!actions[i].depends) continue;
      if (actions[i].depends.length === 0) continue;

      const a = actions[i];

      for (let j = 0; j < actions.length; j++) {
        if (!actions[j].depends) continue;
        if (actions[j].depends.length === 0) continue;

        const b = actions[j];

        if (a.actionType !== b.actionType) continue;

        if (b.depends.indexOf(a.tableName) !== -1 && i > j) {
          const c = actions[i];
          actions[i] = actions[j];
          actions[j] = c;
        }
      }
    }

  // remove duplicate changeColumns
  for (let i = 0; i < actions.length; i++) {
    if (isEqual(actions[i], actions[i - 1])) {
      actions.splice(i, 1);
    }
  }
};

const getPartialMigration = (actions) => {
  const propertyToStr = (obj) => {
    const vals = [];
    for (const k in obj) {
      if (k === 'seqType') {
        vals.push(`"type": ${obj[k]}`);
        continue;
      }

      if (k === 'defaultValue') {
        if (obj[k].internal) {
          vals.push(`"defaultValue": ${obj[k].value}`);
          continue;
        }
        if (obj[k].notSupported) continue;

        const x = {};
        x[k] = obj[k].value;
        vals.push(JSON.stringify(x).slice(1, -1));
        continue;
      }

      const x = {};
      x[k] = obj[k];
      vals.push(JSON.stringify(x).slice(1, -1));
    }

    return `{ ${vals.reverse().join(', ')} }`;
  };

  const getAttributes = (attrs) => {
    const ret = [];
    for (const attrName in attrs) {
      ret.push(`      "${attrName}": ${propertyToStr(attrs[attrName])}`);
    }
    return ` { \n${ret.join(', \n')}\n     }`;
  };

  const addTransactionToOptions = (options) => {
    let ret = JSON.stringify({ ...options, transaction: '###TRANSACTION###' });
    ret = ret.replace('"transaction":"###TRANSACTION###"', 'transaction');
    return ret;
  };

  const commands = [];
  const consoleOut = [];

  for (const i in actions) {
    const action = actions[i];
    switch (action.actionType) {
      case 'createTable':
        {
          const resUp = `{ fn: "createTable", params: [
    "${action.tableName}",
    ${getAttributes(action.attributes)},
    ${addTransactionToOptions(action.options)}
] }`;
          commands.push(resUp);

          consoleOut.push(
            `createTable "${action.tableName}", deps: [${action.depends.join(', ')}]`,
          );
        }
        break;

      case 'dropTable':
        {
          const res = `{ fn: "dropTable", params: ["${action.tableName}", { transaction }] }`;
          commands.push(res);

          consoleOut.push(`dropTable "${action.tableName}"`);
        }
        break;

      case 'addColumn':
        {
          const resUp = `{ fn: "addColumn", params: [
    "${action.tableName}",
    "${action.options && action.options.field ? action.options.field : action.attributeName}",
    ${propertyToStr(action.options)},
    { transaction }
] }`;

          commands.push(resUp);

          consoleOut.push(`addColumn "${action.attributeName}" to table "${action.tableName}"`);
        }
        break;

      case 'removeColumn':
        {
          const res = `{ fn: "removeColumn", params: [
    "${action.tableName}",
    "${action.options && action.options.field ? action.options.field : action.columnName}",
    { transaction }
  ]
}`;
          commands.push(res);

          consoleOut.push(
            `removeColumn "${
              action.options && action.options.field ? action.options.field : action.columnName
            }" from table "${action.tableName}"`,
          );
        }
        break;

      case 'changeColumn':
        {
          const res = `{ fn: "changeColumn", params: [
    "${action.tableName}",
    "${action.options && action.options.field ? action.options.field : action.attributeName}",
    ${propertyToStr(action.options)},
    { transaction }
] }`;
          commands.push(res);

          consoleOut.push(`changeColumn "${action.attributeName}" on table "${action.tableName}"`);
        }
        break;

      case 'addIndex':
        {
          const res = `{ fn: "addIndex", params: [
    "${action.tableName}",
    ${JSON.stringify(action.fields)},
    ${addTransactionToOptions(action.options)}
] }`;
          commands.push(res);

          const nameOrAttrs =
            action.options && action.options.indexName && action.options.indexName !== ''
              ? `"${action.options.indexName}"`
              : JSON.stringify(action.fields);
          consoleOut.push(`addIndex ${nameOrAttrs} to table "${action.tableName}"`);
        }
        break;

      case 'removeIndex':
        {
          //                log(action)
          const nameOrAttrs =
            action.options && action.options.indexName && action.options.indexName !== ''
              ? `"${action.options.indexName}"`
              : JSON.stringify(action.fields);

          const res = `{ fn: "removeIndex", params: [
    "${action.tableName}",
    ${nameOrAttrs},
    { transaction }
] }`;
          commands.push(res);

          consoleOut.push(`removeIndex ${nameOrAttrs} from table "${action.tableName}"`);
        }

        break;
      default:
      // code
    }
  }

  return { commands, consoleOut };
};

const getMigration = (upActions, downActions) => {
  const { commands: commandsUp, consoleOut } = getPartialMigration(upActions);
  const { commands: commandsDown } = getPartialMigration(downActions);
  return { commandsUp, commandsDown, consoleOut };
};

const writeMigration = (
  revision,
  migration,
  migrationsDir,
  name = '',
  comment = '',
  timestamp = true,
  es6 = false,
) => {
  let commandsUp = `const migrationCommands = (transaction) => {return [ \n${migration.commandsUp.join(
    ', \n',
  )} \n];};\n`;
  let commandsDown = `const rollbackCommands = (transaction) => {return [ \n${migration.commandsDown.join(
    ', \n',
  )} \n];};\n`;
  const actions = ` * ${migration.consoleOut.join('\n * ')}`;

  commandsUp = prettier.format(commandsUp, { parser: 'babel' });
  commandsDown = prettier.format(commandsDown, { parser: 'babel' });
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
  const filename = join(
    migrationsDir,
    revision +
      (timestamp ? `-${Date.now()}` : '') +
      (name !== '' ? `-${name}` : '') +
      (es6 ? '.cjs' : '.js'),
  );

  writeFileSync(filename, content);

  return { filename, info };
};

export default {
  writeMigration,
  getMigration,
  sortActions,
  parseDifference,
  reverseModels,
};
