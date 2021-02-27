import { getDefaultValueType, pathConfig, readAsset } from '../lib/helpers.js';

test('getDefaultValueType', () => {
  expect(getDefaultValueType('Try')).toEqual({ value: 'Try' });
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  expect(getDefaultValueType(() => {})).toEqual({ notSupported: true, value: '' });
  expect(getDefaultValueType({ constructor: { name: 'Try' } }, 'Seq.')).toEqual({
    internal: true,
    value: 'Seq.Try',
  });
});

test('pathConfig', async () => {
  const options = {
    pwdPath: 'example/example',
    ignoreSequelizerc: true,
    debug: false,
  };
  const Config = pathConfig(options);
  Object.entries(Config).forEach(([key, val]) => {
    Config[key] = val.replace(/\\/g, '/');
  });
  expect(Config).toStrictEqual({
    modelsDir: 'example/example/models',
    migrationsDir: 'example/example/migrations',
    stateDir: 'example/example/migrations',
    indexDir: 'example/example/models/index.js',
    packageDir: 'example/example/package.json',
  });
});

test('readAsset', () => {
  expect(readAsset('migrations/skeleton.js')).toBeTruthy();
});
