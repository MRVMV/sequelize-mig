import { join } from 'path';
import { existsSync } from 'fs';

export default async (options) => {
  let sequelizercConfigs = [];
  const sequelizercPath = join(process.env.PWD, '.sequelizerc');

  if (existsSync(sequelizercPath)) {
    sequelizercConfigs = await import(sequelizercPath);
  }

  if (!process.env.PWD) process.env.PWD = process.cwd();

  let migrationsDir = join(process.env.PWD, 'migrations');
  let modelsDir = join(process.env.PWD, 'models');
  let packageDir = join(process.env.PWD, 'package.json');

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
    migrationsDir,
    modelsDir,
    packageDir,
  };
};
