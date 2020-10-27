import deepDiff from 'deep-diff';

import { parseAttributes, parseIndex } from './parser.js';

const { log } = console;

export const reverseModels = (sequelize, models) => {
  const tables = {};

  delete models.default;

  Object.entries(models).forEach(([modelName, model]) => {
    const attributes = parseAttributes(
      sequelize,
      modelName,
      model.attributes || model.rawAttributes,
    );

    if (model.options.indexes.length > 0) {
      const idxOut = {};

      Object.values(model.options.indexes).forEach((idx) => {
        const index = parseIndex(idx);
        idxOut[index.hash] = index;
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
  //    log(JSON.stringify(currentState, null, 4));
  const difference = deepDiff.diff(previousState, currentState);
  if (!difference) return [];

  const actions = [];

  Object.values(difference).forEach((df) => {
    let action = { tableName: df.path[0], depends: [df.path[0]], options: {} };
    let actionOptional = { ...action };

    //    log (JSON.stringify(df, null, 4));
    switch (df.kind) {
      // add new
      case 'N':
        // new table created
        if (df.path.length === 1) {
          action.actionType = 'createTable';
          action.depends = [];
          action.attributes = df.rhs.schema;

          if (action.tableName) {
            Object.values(df.rhs.schema).forEach((column) => {
              if (column.references) action.depends.push(column.references.model);
            });
          }

          if (typeof df.rhs.charset !== 'undefined') action.options.charset = df.rhs.charset;

          // create indexes
          if (df.rhs.indexes)
            Object.values(df.rhs.indexes).forEach((index) => {
              actionOptional = { ...index };
              actionOptional.actionType = 'addIndex';
              actionOptional.tableName = action.tableName;
              actionOptional.depends = [action.tableName];
            });
          break;
        } else if (df.path[1] === 'schema') {
          // if (df.path.length === 3) - new field
          if (df.path.length === 3) {
            // new field
            if (df.rhs && df.rhs.references) action.depends.push(df.rhs.references.modelName);

            action.actionType = 'addColumn';
            action.attributeName = df.path[2];
            action.options = df.rhs;

            break;
            // if (df.path.length > 3) - add new attribute to column (change col)
          } else if (df.path.length > 3) {
            // new field attributes
            action.options = currentState[action.tableName].schema[df.path[2]];
            if (action.options.references) action.depends.push(action.options.references.nodel);

            action.attributeName = df.path[2];
            break;
          }
          // new index
        } else if (df.path[1] === 'indexes') {
          if (df.rhs) {
            action = { ...df.rhs };
            action.actionType = 'addIndex';
          }
          break;
        }
        break;

      // drop
      case 'D':
        if (df.path.length === 1) {
          // drop table
          action.actionType = 'dropTable';
          action.depends = [];
          break;
        } else if (df.path[1] === 'schema') {
          // if (df.path.length === 3) - drop field
          if (df.path.length === 3) {
            // drop column
            action.actionType = 'removeColumn';
            action.columnName = df.path[2];
            action.options = df.lhs;
            break;
            // if (df.path.length > 3) - drop attribute from column (change col)
          } else if (df.path.length > 3) {
            // new field attributes
            action.options = currentState[action.tableName].schema[df.path[2]];
            if (action.options.references) action.depends.push(action.options.references.nodel);

            action.attributeName = df.path[2];
            break;
          }
        } else if (df.path[1] === 'indexes') {
          // log(df)
          actionOptional.actionType = 'removeIndex';
          actionOptional.fields = df.lhs.fields;
          actionOptional.options = df.lhs.options;
          break;
        }
        break;

      // edit
      case 'E':
        if (df.path[1] === 'schema') {
          // new field attributes
          action.options = currentState[action.tableName].schema[df.path[2]];
          if (action.options.references) action.depends.push(action.options.references.nodel);

          action.attributeName = df.path[2];
          // updated index
          // only support updating and dropping indexes
        } else if (df.path[1] === 'indexes') {
          const loopIndexes = (diff, actionType) => {
            Object.values(diff).forEach((val) => {
              // const index = clone(diff[key]);
              action.actionType = actionType;
              action.fields = diff[val].fields;
              action.options = diff[val].options;
              actions.push(action);
            });
          };
          loopIndexes(df.rhs, 'addIndex');
          loopIndexes(df.lhs, 'removeIndex');
          action.actionType = '';
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
    if (action.actionType) actions.push(action);
    if (actionOptional.actionType) actions.push(actionOptional);
  });
  return actions;
};
