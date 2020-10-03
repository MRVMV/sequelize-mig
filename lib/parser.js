import Sequelize from 'sequelize';
import hash from 'object-hash';

const { log } = console;
const { DataTypes } = Sequelize;

export const getColumnTypeNameBase = (attrName, attrObj, options) => {
  switch (attrName) {
    // CHAR(length, binary)
    case DataTypes.CHAR.key:
      if (options.binary) return `CHAR.BINARY`;
      return `CHAR(${options.length})`;

    // STRING(length, binary).BINARY
    case DataTypes.STRING.key:
      return `STRING${options.length ? `(${options.length})` : ''}${
        options.binary ? '.BINARY' : ''
      }`;

    // TEXT(length)
    case DataTypes.TEXT.key:
      if (!options.length) return `TEXT`;
      if (typeof options.length === 'string') return `TEXT("${options.length.toLowerCase()}")`;
      return `TEXT(${options.length.toLowerCase()})`;

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

      return `${ret.join('.')}`;
    }

    case DataTypes.ENUM.key:
      return `ENUM('${options.values.join("', '")}')`;

    case DataTypes.BLOB.key:
      if (!options.length) return `BLOB`;
      if (typeof options.length === 'string') return `BLOB("${options.length.toLowerCase()}")`;
      return `BLOB(${options.length.toLowerCase()})`;

    case DataTypes.GEOMETRY.key:
      if (options.type) {
        if (options.srid) return `GEOMETRY('${options.type}', ${options.srid})`;
        return `GEOMETRY('${options.type}')`;
      }
      return 'GEOMETRY';

    case DataTypes.GEOGRAPHY.key:
      return 'GEOGRAPHY';

    case DataTypes.ARRAY.key: {
      const type = attrObj.toString();
      const match = type.match(/(\w+)\[\]/);
      const arrayType = match.length >= 1 ? `{prefix}${match[1]}` : '{prefix}STRING';
      return `ARRAY(${arrayType})`;
    }
    case DataTypes.RANGE.key:
      console.warn(`${attrName} type not supported, you should make it by`);
      return attrObj.toSql();

    // BOOLEAN, TIME, DATE, DATEONLY, HSTORE, JSONB
    // UUID, UUIDV1, UUIDV4, VIRTUAL, INET, MACADDR
    default:
      return attrName;
  }
};

export const getColumnTypeName = (col, prefix = 'Sequelize.') => {
  const attrName = typeof col.type.key === 'undefined' ? col.type : col.type.key;
  const attrObj = col.type;
  const options = col.type.options ? col.type.options : {};

  const columnTypeName = getColumnTypeNameBase(attrName, attrObj, options);

  return `${prefix}${columnTypeName.replace('{prefix}', prefix)}`;
};

export const getDefaultValueType = (defaultValue, prefix = 'Sequelize.') => {
  if (typeof defaultValue === 'object' && defaultValue.constructor && defaultValue.constructor.name)
    return { internal: true, value: prefix + defaultValue.constructor.name };

  if (typeof defaultValue === 'function') return { notSupported: true, value: '' };

  return { value: defaultValue };
};

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

export const parseProperties = (modelName, columnName, column) => {
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
        log(`[Not supported] Skip defaultValue column of attribute ${modelName}:${columnName}`);
        delete column[propertyName];
      }
    }
  });
};

export const parseAttributes = (sequelize, modelName, attributes) => {
  Object.entries(attributes).forEach(([columnName, column]) => {
    delete column.Model;
    delete column.fieldName;
    // delete attributes[attributeName].field;
    parseProperties(modelName, columnName, column);

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
    if (seqType !== 'Sequelize.VIRTUAL') {
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
    } else {
      log(`[SKIP] Skip Sequelize.VIRTUAL column "${columnName}"", defined in model "${modelName}"`);
      delete attributes[columnName];
    }
  });

  return attributes;
};
