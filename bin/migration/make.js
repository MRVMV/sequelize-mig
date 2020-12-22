import fs from 'fs';
import { createRequire } from 'module';
import prettier from 'prettier';
import { pathConfig } from '../../lib/helpers.js';
import { migrate, writeMigration } from '../../lib/migration.js';

const require = createRequire(import.meta.url);

const make = async (argv) => {
  const configOptions = pathConfig(argv);

  let migrationResult;
  try {
    migrationResult = await migrate(configOptions);
  } catch (e) {
    console.error(e);
    return;
  }
  let { previousState, currentState, migration } = migrationResult;

  if (migration.commandsUp.length === 0) {
    console.log('No changes found, No new migration needed!');
    return;
  }

  // log migration actions
  migration.consoles.forEach((action, index) => console.log(`[Action #${index}] ${action}`));

  if (argv.preview) {
    console.log('Migration result:');
    console.log(
      prettier.format(`[ \n${migration.commandsUp.join(', \n')} \n];\n`, {
        parser: 'babel',
      }),
    );
    return;
  }

  // backup _current file
  if (currentState.exists)
    fs.writeFileSync(currentState.backupPath, JSON.stringify(previousState, null, 4));

  // save current state
  currentState.revision = previousState.revision + 1;
  fs.writeFileSync(currentState.path, JSON.stringify(currentState, null, 4));

  // eslint-disable-next-line import/no-dynamic-require
  const { type } = require(configOptions.packageDir);

  // write migration to file
  const info = writeMigration(
    currentState.revision,
    migration,
    configOptions.migrationsDir,
    argv.name ? argv.name : 'noname',
    argv.comment ? argv.comment : '',
    argv.es6 !== null ? argv.es6 : type === 'module',
  );

  console.log(
    `New migration to revision ${currentState.revision} has been saved to file\n'${info.filename}'`,
  );
};

export default make;
