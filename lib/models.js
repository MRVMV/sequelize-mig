/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import lodash from 'lodash';
import deepDiff from 'deep-diff';
import Sequelize from 'sequelize';

import { getColumnTypeName, getDefaultValueType, parseIndex } from './parser.js';

const { each, extend, clone, isEqual } = lodash;
const { log } = console;

export const reverseModels = (sequelize, models) => {
  const tables = {};

  delete models.default;

  Object.keys(models).forEach((model) => {
    const attributes = models[model].attributes || models[model].rawAttributes;

    Object.keys(attributes).forEach((column) => {
      delete attributes[column].Model;
      delete attributes[column].fieldName;
      // delete attributes[column].field;

      Object.keys(attributes[column]).forEach((property) => {
        if (
          property.startsWith('_') ||
          property === 'validate' ||
          typeof attributes[column][property] === 'function'
        ) {
          delete attributes[column][property];
        } else if (property === 'defaultValue') {
          const val = getDefaultValueType(attributes[column][property]);
          if (!val.notSupported) {
            attributes[column][property] = val;
          } else {
            log(`[Not supported] Skip defaultValue column of attribute ${model}:${column}`);
            delete attributes[column][property];
          }
        }
      });

      if (typeof attributes[column].type === 'undefined') {
        if (!attributes[column].seqType) {
          log(`[Not supported] Skip column with undefined type ${model}:${column}`);
          delete attributes[column];
          return;
        }
        if (
          !['Sequelize.ARRAY(Sequelize.INTEGER)', 'Sequelize.ARRAY(Sequelize.STRING)'].includes(
            attributes[column].seqType,
          )
        ) {
          delete attributes[column];
          return;
        }
        attributes[column].type = {
          key: Sequelize.ARRAY.key,
        };
      }

      let seqType = getColumnTypeName(attributes[column]);

      // NO virtual types in migration
      if (seqType !== 'Sequelize.VIRTUAL') {
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
      } else {
        log(`[SKIP] Skip Sequelize.VIRTUAL column "${column}"", defined in model "${model}"`);
        delete attributes[column];
      }
    });

    tables[models[model].tableName] = {
      tableName: models[model].tableName,
      schema: attributes,
    };

    if (models[model].options.indexes.length > 0) {
      const idxOut = {};

      Object.keys(models[model].options.indexes).forEach((i) => {
        const index = parseIndex(models[model].options.indexes[i]);
        idxOut[`${index.hash}`] = index;
        delete index.hash;

        // make it immutable
        Object.freeze(index);
      });
      models[model].options.indexes = idxOut;
    }

    if (typeof models[model].options.charset !== 'undefined')
      tables[models[model].tableName].charset = models[model].options.charset;

    tables[models[model].tableName].indexes = models[model].options.indexes;
  });

  return tables;
};

export const parseDifference = (previousState, currentState) => {
  const pushChangeColumn = (actions, tableName, df, options, depends) => {
    actions.push({
      actionType: 'changeColumn',
      tableName,
      attributeName: df.path[2],
      options,
      depends,
    });
  };

  //    log(JSON.stringify(currentState, null, 4));
  const actions = [];
  const difference = deepDiff.diff(previousState, currentState);

  Object.values(difference).forEach((df) => {
    //    log (JSON.stringify(df, null, 4));
    switch (df.kind) {
      // add new
      case 'N':
        {
          // new table created
          if (df.path.length === 1) {
            const depends = [];
            const { tableName } = df.rhs;
            if (tableName) {
              each(df.rhs.schema, (v) => {
                if (v.references) depends.push(v.references.model);
              });
            }

            const options = {};
            if (typeof df.rhs.charset !== 'undefined') options.charset = df.rhs.charset;

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

                pushChangeColumn(actions, tableName, df, options, depends);
                break;
              }
            }
          }

          // new index
          if (df.path[1] === 'indexes') {
            if (df.rhs) {
              const index = clone(df.rhs);
              index.actionType = 'addIndex';
              index.tableName = tableName;
              index.depends = [tableName];
              actions.push(index);
            }
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

              pushChangeColumn(actions, tableName, df, options, depends);
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

            pushChangeColumn(actions, tableName, df, options, depends);
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
  });
  return actions;
};

export const sortActions = (actions) => {
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
  for (let k = 0; k <= actions.length; k++) {
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      if (a.depends?.length !== 0) {
        for (let j = 0; j < actions.length; j++) {
          const b = actions[j];
          if (
            b.depends?.length !== 0 &&
            a.actionType === b.actionType &&
            b.depends?.indexOf(a.tableName) !== -1 &&
            i > j
          ) {
            const c = actions[i];
            actions[i] = actions[j];
            actions[j] = c;
          }
        }
      }
    }
  }

  // remove duplicate changeColumns
  for (let i = 0; i < actions.length; i++) {
    if (isEqual(actions[i], actions[i - 1])) actions.splice(i, 1);
  }
};
