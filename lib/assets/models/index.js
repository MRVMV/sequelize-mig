import dotenv from 'dotenv';
import { readdirSync } from 'fs';
import { dirname as _dirname, basename as _basename, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import Sequelize from 'sequelize';

dotenv.config({ silent: true });
const require = createRequire(import.meta.url);
const env = process.env.NODE_ENV || 'development';

const filename = fileURLToPath(import.meta.url);
const dirname = _dirname(filename);
const basename = _basename(__filename);

const { DataTypes } = Sequelize;

const data = require('<%configFile%>');

const config = data[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

readdirSync(dirname)
  .filter((file) => {
    return (
      file.slice(0, 1) !== '.' &&
      file !== basename &&
      (file.slice(-3) === '.js' || file.slice(-4) === '.cjs' || file.slice(-4) === '.mjs')
    );
  })
  .forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require
    const model = require(join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
