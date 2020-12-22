import fs from 'fs';
import prettier from 'prettier';
import { pathConfig } from '../../lib/helpers.js';
import { migrate } from '../../lib/migration.js';

const sync = async (argv) => {
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

  console.log('Migrations synced successfully');
};

export default sync;
