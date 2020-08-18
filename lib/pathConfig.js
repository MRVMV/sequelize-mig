import { join } from 'path';
import { existsSync } from 'fs';

export default function (options) {
  let sequelizercConfigs = [],
    sequelizercPath = join(process.env.PWD, '.sequelizerc');

  if (existsSync(sequelizercPath)) {
    sequelizercConfigs = require(sequelizercPath);
  }

  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }

  let migrationsDir = join(process.env.PWD, 'migrations'),
    modelsDir = join(process.env.PWD, 'models'),
    packageDir = join(process.env.PWD, 'package.json');

  if (options['migrations-path']) {
    migrationsDir = join(process.env.PWD, options['migrations-path']);
  } else if (sequelizercConfigs['migrations-path']) {
    migrationsDir = sequelizercConfigs['migrations-path'];
  }

  if (options['models-path']) {
    modelsDir = join(process.env.PWD, options['models-path']);
  } else if (sequelizercConfigs['models-path']) {
    modelsDir = sequelizercConfigs['models-path'];
  }
  if (options['package-path']) {
    packageDir = join(process.env.PWD, options['package-path']);
  }

  return {
    migrationsDir: migrationsDir,
    modelsDir: modelsDir,
    packageDir: packageDir,
  };
};
