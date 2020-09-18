import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { dirname: _dirname, join } = path;

const dirname = _dirname(fileURLToPath(import.meta.url));

export const getYYYYMMDDHHMMSS = (date = new Date()) => {
  return [
    date.getUTCFullYear(),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCDate().toString().padStart(2, '0'),
    date.getUTCHours().toString().padStart(2, '0'),
    date.getUTCMinutes().toString().padStart(2, '0'),
    date.getUTCSeconds().toString().padStart(2, '0'),
  ].join('');
};

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
  let PWD = process.env.PWD ? process.env.PWD : process.cwd();
  if (options.pwdPath)
    PWD = options.pwdPath.slice(0, 2) === './' ? join(PWD, options.pwdPath) : options.pwdPath;

  let sequelizercPath = join(PWD, '.sequelizerc');
  if (options.sequelizercPath) sequelizercPath = join(PWD, options.sequelizercPath);

  // eslint-disable-next-line import/no-dynamic-require
  const sequelizerc = (fs.existsSync(sequelizercPath)) ? require(sequelizercPath) : [];

  const packageDir = join(PWD, 'package.json');

  // @ToDo Add env option
  
  let migrationsDir = join(PWD, 'migrations');
  let modelsDir = join(PWD, 'models');
  let stateDir = modelsDir;
  let indexDir;

  if (sequelizerc['models-path']) modelsDir = sequelizerc['models-path'];
  if (sequelizerc['migrations-path']) migrationsDir = sequelizerc['migrations-path'];

  indexDir = join(modelsDir, 'index.js');

  if (options.modelsPath) modelsDir = join(PWD, options.modelsPath);
  if (options.migrationsPath) migrationsDir = join(PWD, options.migrationsPath);
  if (options.indexFilePath) indexDir = join(PWD, options.indexFilePath);
  if (options.statePath) stateDir = join(PWD, options.statePath);

  return {
    modelsDir,
    migrationsDir,
    stateDir,
    indexDir,
    packageDir,
  };
};

export default pathConfig;
