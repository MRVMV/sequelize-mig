import deepDiff from 'deep-diff';
import inquirer from 'inquirer';
import hash from 'object-hash';

import { parseAttributes, parseIndex } from './parser.js';
import { groupBy } from './functions.js';

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

/**
 * Searches for columns that may have been renamed by
 *
 * - grouping all diffs by the table they belong to
 * - finding all diffs that are removing or adding a column
 * - check if there are a pair of add/remove diffs that, other than the name, have the same attributes
 *
 * @param {deepDiff.Diff[]} difference
 */
const detectPossibleRenames = (difference) => {
  const diffsByTable = groupBy(difference, (d) => d.path[0]);

  const possibleRenames = [];

  Object.values(diffsByTable).forEach((diffs) => {
    const deletedColumns = diffs.filter((d) => d.kind === 'D' && d.path.length === 3);
    const addedColumns = diffs.filter((d) => d.kind === 'N' && d.path.length === 3);

    // iterate over all of the deleted columns in the table
    // eslint-disable-next-line no-restricted-syntax
    for (const deletedColumn of deletedColumns) {
      // if there's an added column that has all the same attributes (other than the name) it's possibly a renamed column
      const deletedColumnHash = hash({ ...deletedColumn.lhs, field: undefined });
      const matchingAdd = addedColumns.find(
        (addedColumn) =>
          deletedColumnHash ===
          hash({
            ...addedColumn.rhs,
            field: undefined,
          }),
      );

      if (matchingAdd) possibleRenames.push({ previous: deletedColumn, current: matchingAdd });
    }
  });

  return possibleRenames;
};

const confirmRename = async ({ current, previous }, upActions) => {
  if (!upActions) {
    const { didRename } = await inquirer.prompt({
      type: 'confirm',
      name: 'didRename',
      message: `Did you rename the ${current.path[0]} table column "${previous.lhs.field}" to "${current.rhs.field}"?`,
    });
    return didRename;
  }
  // don't ask the user again if we're computing the downActions, just check if the renameColumn action exists
  return upActions.some(
    ({ actionType, tableName, columnName, options }) =>
      actionType === 'renameColumn' &&
      tableName === current.path[0] &&
      columnName === current.path[2] &&
      options === previous.path[2],
  );
};

const confirmRenamedColumns = async (difference, possibleRenames, upActions) => {
  const actions = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const possibleRename of possibleRenames) {
    const { previous, current } = possibleRename;

    const isConfirmed = await confirmRename(possibleRename, upActions);
    if (isConfirmed) {
      actions.push({
        actionType: 'renameColumn',
        tableName: current.path[0],
        depends: [current.path[0]],
        options: current.path[2],
        columnName: previous.path[2],
      });

      // remove the addColumn and removeColumn actions
      const kinds = [previous.kind, current.kind];
      const fields = [previous.path[2], current.path[2]];
      difference = difference.filter(
        (d) => d.path.length !== 3 || !(kinds.includes(d.kind) && fields.includes(d.path[2])),
      );
    }
  }
  return [difference, actions];
};

export const getActions = async (oldTables, newTables, upActions = null) => {
  const loopIndexes = (diff, actionType, actions, actionTemplate, ArrayOfIndexes = false) => {
    Object.values(diff).forEach((index) => {
      if (ArrayOfIndexes) index = index[index];
      const actionTemp = {
        actionType,
        fields: index.fields,
        options: index.options,
        tableName: actionTemplate.tableName,
        depends: actionTemplate.depends,
      };
      actions.push(actionTemp);
    });
  };

  const initialDifferences = deepDiff.diff(oldTables, newTables);
  if (!initialDifferences) return [];

  const possibleRenames = detectPossibleRenames(initialDifferences);

  const [difference, actions] = await confirmRenamedColumns(
    initialDifferences,
    possibleRenames,
    upActions,
  );

  Object.values(difference).forEach((df) => {
    const action = { tableName: df.path[0], depends: [df.path[0]], options: {} };
    const actionOptional = { ...action };

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
          if (df.rhs.indexes) {
            loopIndexes(df.rhs.indexes, 'addIndex', actions, actionOptional);
            break;
          }
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
            action.options = newTables[action.tableName].schema[df.path[2]];
            if (action.options.references) action.depends.push(action.options.references.nodel);

            action.actionType = 'changeColumn';
            action.attributeName = df.path[2];
            break;
          }
          // new index
        } else if (df.path[1] === 'indexes') {
          if (df.rhs) {
            action.actionType = 'addIndex';
            action.fields = df.rhs.fields;
            action.options = df.rhs.options;
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
            action.options = newTables[action.tableName].schema[df.path[2]];
            if (action.options.references) action.depends.push(action.options.references.nodel);

            action.actionType = 'changeColumn';
            action.attributeName = df.path[2];
            break;
          }
        } else if (df.path[1] === 'indexes') {
          // log(df)
          action.actionType = 'removeIndex';
          action.fields = df.lhs.fields;
          action.options = df.lhs.options;
          break;
        }
        break;

      // edit
      case 'E':
        if (df.path[1] === 'schema') {
          // new field attributes
          action.options = newTables[action.tableName].schema[df.path[2]];
          if (action.options.references) action.depends.push(action.options.references.nodel);

          action.actionType = 'changeColumn';
          action.attributeName = df.path[2];

          // updated index
          // only support updating and dropping indexes
        } else if (df.path[1] === 'indexes') {
          loopIndexes(df.rhs, 'addIndex', actions, actionOptional, true);
          loopIndexes(df.lhs, 'removeIndex', actions, actionOptional, true);
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
