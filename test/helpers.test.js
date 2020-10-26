import { pathConfig, readAsset } from '../lib/helpers.js';

test('pathConfig', async () => {
  const options = {
    pwdPath: 'example/example',
    ignoreSequelizerc: true,
  };
  expect(pathConfig(options)).toStrictEqual({
    modelsDir: 'example\\example\\models',
    migrationsDir: 'example\\example\\migrations',
    stateDir: 'example\\example\\models',
    indexDir: 'example\\example\\models\\index.js',
    packageDir: 'example\\example\\package.json',
  });
});
test('readAsset', () => {
  expect(readAsset('migrations/skeleton.js')).toBeTruthy();
});
