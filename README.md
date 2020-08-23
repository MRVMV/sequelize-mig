# sequelize-mig
Sequelize migration generator (and es6 init tool)

###### THIS TOOL IS UNDER DEVELOPMENT AND NOT INTENDED TO PRODUCTION USE RIGHT NOW!!!! ######

The tool is built using es6 (not fully migrated until now)
And its not intended to replace sequelize-cli its just completing it

This package provide two tools:
* `make` - tool for create new migrations by comparing new version of you modules to old one
* `init` - tool to init required files for sequelize using new es6 schema (Planned)

## Install
(Globally - Recommended) `npm install sequelize-mig -g` / `yarn global add sequelize-mig`
Or
(devDependencies) `npm install sequelize-mig -D` / `yarn add sequelize-mig -D`

## Usage
* Init sequelize, with sequelize-cli, using `sequelize init` (or using es6 init by sequelize-mig -Planned-)
* Create your models manually or using sequelize-cli (or using es6 init by sequelize-mig -Planned-)
* Create initial migration:
`sequelize-mig migration:make --n <migration name>`

To preview new migration, without any changes, you can run:

`sequelize-mig migration:make --preview`

* Finally run migration using sequelize-cli `sequelize-mig db:migrate`

## Limitations
The migration:make tool supports auto detecting these actions
    'dropTable','removeColumn','removeIndex',
    'createTable','addColumn','addIndex',
    'changeColumn'
and Im trying to find a way to know old column name to implement renameColumn because it's now translated to removeColumn then addColumn

## Notes
* You will be able to make index and modules as es6 but keep migration files as es5 because sequelize-cli isn't compatible with it yet.
* `migration:make` tool creates `_current.json` and `_current_bak.json` files in `migrations` dir, these are used to calculate difference to the next migration. Do not remove them!

## TODO:
* Allow init using es6 modules
* Adding renameColumn in some way I didn't know until now

## Credits
* Depending on Scimonster/sequelize-auto-migrations which is forked from flexxnn/sequelize-auto-migrations
* The main projects are not maintained any more
