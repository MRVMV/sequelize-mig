import { createRequire } from 'module';

import fs from 'fs';
import path from 'path';

import { pathConfig } from '../../lib/helpers.js';
import { getFileName } from '../../lib/functions.js';

const require = createRequire(import.meta.url);

const undo = async (argv) => {
  const { migrationsDir, stateDir } = pathConfig(argv);

  const curStatePath = path.join(stateDir, '_current.json');
  const curStateName = getFileName(curStatePath);
  let curStateRevision;

  let bakStatePath = path.join(stateDir, '_current_bak.json');
  let bakStateName;
  let bakStateRevision;

  let curMigPath;
  let curMigName;
  let curMigRevision;

  if (fs.existsSync(curStatePath)) {
    // eslint-disable-next-line import/no-dynamic-require
    const curState = require(curStatePath);
    bakStatePath = curState.backupPath;

    curStateRevision = curState.revision;
    console.log(`Current state file: ${curStateName}, Revision: ${curStateRevision}`);
  } else {
    console.log("Can't find current state. Skipping");
  }

  if (fs.existsSync(migrationsDir)) {
    const migs = fs.readdirSync(migrationsDir);

    if (migs.length > 0) {
      curMigName = migs[migs.length - 1];
      curMigPath = path.join(migrationsDir, curMigName);

      curMigRevision = (await import(`file:////${curMigPath}`)).default.info.revision;
      console.log(`Current migration file: ${curMigName}, Revision: ${curMigRevision}`);
    } else {
      console.log("Can't find any migrations files. Skipping");
    }
  } else {
    console.log("Can't find migrations folder. Skipping");
  }

  if (fs.existsSync(bakStatePath)) bakStateRevision = curStateRevision - 1;

  if (
    argv.force ||
    !argv.delCurStt ||
    !argv.delCurMig ||
    !argv.renBakStt ||
    !curStateRevision ||
    !curMigRevision ||
    curMigRevision === curStateRevision
  ) {
    if (curStateRevision && argv.delCurStt) {
      fs.unlinkSync(curStatePath);
      console.log(`Deleted current state file: ${curStateName}`);
    }

    if (curMigRevision && argv.delCurMig) {
      fs.unlinkSync(curMigPath);
      console.log(`Deleted current migration file: ${curMigName}`);
    }

    if (bakStateRevision && argv.renBakStt) {
      fs.renameSync(bakStatePath, curStatePath);

      bakStateName = getFileName(bakStatePath);
      console.log(
        `Reverted to backup state: ${bakStateName} new name: ${curStateName}, Revision: ${bakStateRevision}`,
      );
    } else if (!bakStateRevision) {
      console.log("Can't find backup state. Skipping.");
    }
    console.log('We are done!');
  } else {
    console.log(
      `Revisions from current state and current migration Are not equal.
      So they are not synced. anyway you can force tool running with -f or turn on specific options`,
    );
  }
};

export default undo;
