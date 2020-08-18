# sequelize-mig
Sequelize migration generator and es6 init tool (Planned)

###### THIS TOOL IS UNDER DEVELOPMENT AND NOT INTENDED TO PRODUCTION USE RIGHT NOW!!!! ######

The tool is built using es6 (not fully migrated until now)
And its not intended to replace sequelize-cli its just completing it

This package provide two tools:
* `make` - tool for create new migrations by comparing new version of you modules to old one
* `init` - tool to init required files for sequelize using new es6 schema (Planned)

## Install
`npm install sequelize-mig`
Or
`yarn add sequelize-mig`

## Usage
* Init sequelize, with sequelize-cli, using `sequelize init` (or using es6 models by sequelize-mig -Planned-)
* Create your models manually or using sequelize-cli
* Create initial migration - run:
`sequelize-mig make --n <migration name>`

To preview new migration, without any changes, you can run:

`sequelize-mig make --preview`

`make` tool creates `_current.json` and `_current_bak.json` files in `migrations` dir, these are used to calculate difference to the next migration. Do not remove them!

## Notes
* You will be able to make index and modules as es6 but keep migration files as es5 because sequelize-cli isn't compatible with it.
## TODO:
* Allow init using es6 modules

## Credits
* Forked from Scimonster/sequelize-auto-migrations which is forked from flexxnn/sequelize-auto-migrations
* The main project is not getting updates any more
