# sequelize-mig
Migration generator and es6 init tool (Planned)

This package provide two tools:
* `make` - tool for create new migrations by comparing new version of you modules to old one
* `init` - tool to init required files for sequelize using new es6 schema (Planned)

## Install
`npm install sequelize-mig`
`yarn add sequelize-mig`

## Usage
* Init sequelize, with sequelize-cli, using `sequelize init`
* Create your models manually or using sequelize-cli (or using es6 models by sequelize-mig -Planned-)
* Create initial migration - run:
`sequelize-mig make --name <migration name>`

To preview new migration, without any changes, you can run:

`sequelize-mig make --preview`

`make` tool creates `_current.json` file in `migrations` dir, that is used to calculate difference to the next migration. Do not remove it!

## Notes
* You will be able to make index and modules as es6 but keep migration files as es5 because sequelize-cli isn't compatible with it.
## TODO:
* Allow init using es6 modules

## Credits
* Forked from Scimonster/sequelize-auto-migrations which is forked from flexxnn/sequelize-auto-migrations
* The main project is not getting updates any more

## Old Info (Will be depreciated)
This package provide two tools:
* `makemigration` - tool for create new migrations
* `runmigration` - tool for apply created by first tool migrations

`makemigration --name <migration name>`
* Change models and run it again, model difference will be saved to the next migration

To preview new migration, without any changes, you can run:

`makemigration --preview`

`makemigration` tool creates `_current.json` file in `migrations` dir, that is used to calculate difference to the next migration. Do not remove it!

To create and then execute migration, use:
`makemigration --name <name> -x`

## Executing migrations
* There is simple command to perform all created migrations (from selected revision):

`runmigration`
* To select a revision, use `--rev <x>`
* To prevent execution of next migrations, use `--one`
* To rollback/downgrade to the selected revision, use `--rollback`

Each migration runs in a transaction, so it will be rolled back if part of it fails. To disable, use `--no-transaction`. Then, if it fails, you can continue by using `--pos <x>`.


For more information, use `makemigration --help`, `runmigration --help`

## TODO:
* Migration action sorting procedure need some fixes. When many foreign keys in tables, there is a bug with action order. Now, please check it manually (`--preview` option)
* Need to check (and maybe fix) field types: `BLOB`, `RANGE`, `ARRAY`, `GEOMETRY`, `GEOGRAPHY`
* Allow init using es6 modules
