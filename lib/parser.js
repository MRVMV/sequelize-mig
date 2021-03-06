import Sequelize from 'sequelize';
import hash from 'object-hash';

import { getDefaultValueType, getColumnTypeName } from './helpers.js';

const { log } = console;

export const parseIndex = (idx) => {
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

  if (idx.parser) options.parser = idx.parser; // For FULLTEXT columns set your parser

  idx.options = options;

  idx.hash = hash(idx);

  //    log ('PI:', JSON.stringify(idx, null, 4));
  return idx;
};

export const parseProperties = (modelName, column) => {
  Object.entries(column).forEach(([propertyName, property]) => {
    if (
      propertyName.startsWith('_') ||
      propertyName === 'validate' ||
      typeof property === 'function'
    ) {
      delete column[propertyName];
    } else if (propertyName === 'defaultValue') {
      const val = getDefaultValueType(property);
      if (!val.notSupported) {
        column[propertyName] = val;
      } else {
        log(`[Not supported] Skip defaultValue column of attribute ${modelName}:${column.field}`);
        delete column[propertyName];
      }
    }
  });
};

export const parseAttributes = (sequelize, modelName, attributes) => {
  Object.entries(attributes).forEach(([columnName, column]) => {
    delete column.Model;
    delete column.fieldName;

    parseProperties(modelName, column);

    if (typeof column.type === 'undefined') {
      if (!column.seqType) {
        log(`[Not supported] Skip column with undefined type ${modelName}:${columnName}`);
        delete attributes[columnName];
        return;
      }
      if (
        !['Sequelize.ARRAY(Sequelize.INTEGER)', 'Sequelize.ARRAY(Sequelize.STRING)'].includes(
          column.seqType,
        )
      ) {
        delete attributes[columnName];
        return;
      }
      column.type = {
        key: Sequelize.ARRAY.key,
      };
    }

    let seqType = getColumnTypeName(column);

    // NO virtual types in migration
    if (seqType === 'Sequelize.VIRTUAL') {
      log(`[SKIP] Skip Sequelize.VIRTUAL column "${columnName}"", defined in model "${modelName}"`);
      delete attributes[columnName];
    } else {
      if (!seqType) {
        if (
          typeof column.type.options !== 'undefined' &&
          typeof column.type.options.toString === 'function'
        )
          seqType = column.type.options.toString(sequelize);

        if (typeof column.type.toString === 'function') seqType = column.type.toString(sequelize);
      }

      column.seqType = seqType;

      delete column.type;
      delete column.values; // ENUM
    }
  });

  return attributes;
};
