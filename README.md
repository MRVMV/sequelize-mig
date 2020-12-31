# Sequelize migration generator (and es6 init tool) - [sequelize-mig](https://npmjs.com/package/sequelize-mig)

[![npm](https://img.shields.io/npm/v/sequelize-mig.svg?logo=npm&style=flat-square)](https://npmjs.com/package/sequelize-mig)
[![node](https://img.shields.io/node/v/sequelize-mig.svg?logo=node.js&style=flat-square)](https://www.npmjs.com/package/sequelize-mig)
[![Build Status](https://img.shields.io/travis/mrvmv/sequelize-mig.svg?logo=travis&style=flat-square)](https://travis-ci.org/mrvmv/sequelize-mig)
[![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/mrvmv/sequelize-mig?logo=snyk&style=flat-square)](https://snyk.io/test/github/mrvmv/sequelize-mig)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/MRVMV/sequelize-mig?logo=lgtm&style=flat-square)](https://lgtm.com/projects/g/MRVMV/sequelize-mig/context:javascript)


[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![Contribution-Welcomed](https://img.shields.io/badge/Contribution-Welcomed-blue?logo=github&style=flat-square)](https://github.com/MRVMV/sequelize-mig)
[![Community Chat](https://img.shields.io/badge/Community-Chat-blueChat?logo=telegram&color=blue&style=flat-square)](https://t.me/SequelizeMig)

```Bash
Warning: THIS TOOL IS UNDER DEVELOPMENT AND NOT INTENDED TO PRODUCTION USE RIGHT NOW!!!!
```

The tool is built using es6
And its not intended to replace sequelize-cli its just completing it

This tool provide these commands:
- `migration:make` or `migration:add` - to create new migrations by comparing new version of your modules to old ones
- `migration:undo` or `migration:revert` - delete last migration file and return to backup state file of the models
- `migration:sync` - Sync the models schema file with current models without migrating (Planned)

Planned:
- `init` - tool to init required files for sequelize using new es6 schema (Planned)

## Install

(Globally - Recommended)

```Bash
npm install sequelize-mig -g / yarn global add sequelize-mig
```

Or

(devDependencies)

```Bash
npm install sequelize-mig -D / yarn add sequelize-mig -D
```

## Usage

### For New Users

- Init sequelize, with sequelize-cli, using `sequelize init` (or using es6 init by sequelize-mig -Planned-)
- Create your models manually or using sequelize-cli (or using es6 init by sequelize-mig -Planned-)
- Create initial migration:

```Bash
sequelize-mig migration:make -n <migration name>
```

- To preview new migration, without any changes, you can run:

```Bash
sequelize-mig migration:make --preview
```

- Finally run migration using sequelize-cli `sequelize db:migrate`
- You can use --help to view help of the tool or specific command

### For Old Users

If you already used migrations before knowing this tool you can easily fully migrate in the sequelize-cli tool
and then run `migration:sync` and tool will update `_current.json`
and you can continue using this tool normally

## Limitations

The migration:make tool supports auto detecting these actions

```Bash
dropTable, removeColumn, removeIndex,
createTable, addColumn, addIndex,
changeColumn
```

and Im trying to find a way to know old column name to implement renameColumn because it's now translated to removeColumn then addColumn

## Explanation

The tool works by getting the schema of the models into `_current.json` and every time you run `migration:make` the tool will compare this file with new schema and write the new migration file
then *this tool cant actually know if you deleted, or migrated or whatever you edited to these files*...

## Notes

- You will be able to make index and modules as es6 but keep migration files as es5 because sequelize-cli isn't compatible with it yet.
- `migration:make` tool creates `_current.json` and `_current_bak.json` files in `migrations` dir, these are used to calculate difference to the next migration. Do not remove them!
- Tool create new migration with name `{timestamp}_{name}.{js|cjs}` but you can change every single option with parameters

## TODO

- Allow init using es6 modules
- Adding `renameColumn` in some way I didn't know until now (maybe comments)
- auto add renameColumn conversion when edits are only to letters case or adding \_

## Credits

- Depending on Scimonster/sequelize-auto-migrations which is forked from flexxnn/sequelize-auto-migrations
- The main projects are not maintained any more
