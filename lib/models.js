import lodash from 'lodash';
import deepDiff from 'deep-diff';

import { parseAttributes, parseIndex } from './parser.js';

const { each, extend, clone, isEqual } = lodash;
const { log } = console;

export const reverseModels = (sequelize, models) => {
  const tables = {};

  delete models.default;

  Object.entries(models).forEach(([modelName, model]) => {
    const attributes = parseAttributes(sequelize, modelName, model.attributes || model.rawAttributes);

    if (model.options.indexes.length > 0) {
      const idxOut = {};

      Object.values(model.options.indexes).forEach((idx) => {
        const index = parseIndex(idx);
        idxOut[`${index.hash}`] = index;
        delete index.hash;

        // make it immutable
        Object.freeze(index);
      });
      model.options.indexes = idxOut;
    }

    tables[model.tableName] = {
      tableName: model.tableName,
      schema: attributes,
      indexes: model.options.indexes,
    };

    if (typeof model.options.charset !== 'undefined')
      tables[model.tableName].charset = model.options.charset;
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
  if (!difference) return [];

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
                if (v.references) depends.push(v.references.modelName);
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
              Object.values(df.rhs.indexes).forEach((index) => {
                actions.push(
                  extend(
                    {
                      actionType: 'addIndex',
                      tableName,
                      depends: [tableName],
                    },
                    clone(index),
                  ),
                );
              });
            break;
          }

          const tableName = df.path[0];
          const depends = [tableName];

          if (df.path[1] === 'schema') {
            // if (df.path.length === 3) - new field
            if (df.path.length === 3) {
              // new field
              if (df.rhs && df.rhs.references) depends.push(df.rhs.references.modelName);

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
            const loopIndexes = (diff, actionType) => {
              Object.values(diff).forEach((val) => {
                // const index = clone(diff[key]);
                actions.push({
                  actionType,
                  tableName,
                  fields: diff[val].fields,
                  options: diff[val].options,
                  depends: [tableName],
                });
              });
            };
            loopIndexes(df.rhs, 'addIndex');
            loopIndexes(df.lhs, 'removeIndex');
          }
        }
        break;

      // array change indexes
      case 'A':
        log(
          '[Not supported] Array modelName changes! Problems are possible. Please, check result more carefully!',
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

  // #region new method for sorting actions / NEEDS More TESTING
  /*
  actions.sort((a, b) => {
    if (
      a.depends?.length !== 0 &&
      b.depends?.length !== 0 &&
      a.actionType === b.actionType &&
      b.depends?.indexOf(a.tableName) !== -1
    )
      return -1;
    return 0;
  });

  actions.forEach(() => {
    actions.forEach((a, i) => {
      if (a.depends?.length !== 0) {
        actions.forEach((b, j) => {
          if (
            b.depends?.length !== 0 &&
            a.actionType === b.actionType &&
            b.depends?.indexOf(a.tableName) !== -1 &&
            i > j
          ) {
            const temp = actions[i];
            actions[i] = actions[j];
            actions[j] = temp;
          }
        });
      }
    });
  });
 */
  // #endregion

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
