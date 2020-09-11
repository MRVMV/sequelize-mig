import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const { dirname: _dirname, join } = path;

const dirname = _dirname(fileURLToPath(import.meta.url));

// Windows support
if (!process.env.PWD) process.env.PWD = process.cwd();

export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};
export const readAsset = (assetPath) => {
  return fs.readFileSync(join(dirname, './assets', assetPath)).toString();
};

export const pathConfig = async (options) => {
  let sequelizercConfigs = [];
  const sequelizercPath = join(process.env.PWD, '.sequelizerc');

  // eslint-disable-next-line import/no-dynamic-require
  if (fs.existsSync(sequelizercPath)) sequelizercConfigs = require(sequelizercPath);

  let migrationsDir = join(process.env.PWD, 'migrations');
  let modelsDir = join(process.env.PWD, 'models');

  if (options['models-path']) modelsDir = join(process.env.PWD, options['models-path']);
  else if (sequelizercConfigs['models-path']) modelsDir = sequelizercConfigs['models-path'];

  if (options['migrations-path']) migrationsDir = join(process.env.PWD, options['migrations-path']);
  else if (sequelizercConfigs['migrations-path'])
    migrationsDir = sequelizercConfigs['migrations-path'];

  let packageDir = join(process.env.PWD, 'package.json');
  let indexDir = join(modelsDir, 'index.js');
  let schemasDir = modelsDir;

  if (options['package-path']) packageDir = join(process.env.PWD, options['package-path']);
  if (options['index-file-path']) indexDir = join(process.env.PWD, options['index-file-path']);
  if (options['schemas-path']) schemasDir = join(process.env.PWD, options['schemas-path']);

  return {
    modelsDir,
    migrationsDir,
    schemasDir,
    indexDir,
    packageDir,
  };
};

export default pathConfig;
