## [3.1.3](https://github.com/mrvmv/sequelize-mig/compare/v3.1.2...v3.1.3) (2021-03-30)


### Bug Fixes

* run migrations in transaction ([492c776](https://github.com/mrvmv/sequelize-mig/commit/492c77636c34961a0931fe14dc1293b5861e3759))

## [3.1.2](https://github.com/mrvmv/sequelize-mig/compare/v3.1.1...v3.1.2) (2021-03-19)


### Bug Fixes

* removes node 14 incompatible syntax ([477c68c](https://github.com/mrvmv/sequelize-mig/commit/477c68ce3436956bc6f9edcb8e62a38e1af96b6c))

## [3.1.1](https://github.com/mrvmv/sequelize-mig/compare/v3.1.0...v3.1.1) (2021-03-07)


### Bug Fixes

* renameColumn deleting all D and N diffs ([89560d8](https://github.com/mrvmv/sequelize-mig/commit/89560d876a0fcc999c131ff0877333d4b48c7089))

# [3.1.0](https://github.com/mrvmv/sequelize-mig/compare/v3.0.1...v3.1.0) (2021-03-06)


### Features

* add auto-detection of potential renamed columns ([5471179](https://github.com/mrvmv/sequelize-mig/commit/5471179eff2b0bdf9f2d9a34cc20aec6d0463757))

## [3.0.1](https://github.com/mrvmv/sequelize-mig/compare/v3.0.0...v3.0.1) (2021-02-27)


### Bug Fixes

* not putting cjs if module ([fef2c10](https://github.com/mrvmv/sequelize-mig/commit/fef2c10678a220e0df4879f39f1547f129320a2a))

# [3.0.0](https://github.com/mrvmv/sequelize-mig/compare/v2.8.1...v3.0.0) (2021-02-27)


### Bug Fixes

* current should be in migrations not in models ([08c93b0](https://github.com/mrvmv/sequelize-mig/commit/08c93b0505134f63c103ca769a502a0aefbd6eb1))


### BREAKING CHANGES

* you should move your current to migrations folder

## [2.8.1](https://github.com/mrvmv/sequelize-mig/compare/v2.8.0...v2.8.1) (2021-02-27)


### Bug Fixes

* if defaultValue in getDefaultValueType is null ([8f430d8](https://github.com/mrvmv/sequelize-mig/commit/8f430d832be3632d9f5d97b4013d6da6aa6c3b34))
* update mergify conf and force update ([3606038](https://github.com/mrvmv/sequelize-mig/commit/360603893b213dfb15d8ee740fa8b58936856dc5))

# [2.8.0](https://github.com/mrvmv/sequelize-mig/compare/v2.7.0...v2.8.0) (2021-02-27)


### Bug Fixes

* important one for file path ([a3f6b0e](https://github.com/mrvmv/sequelize-mig/commit/a3f6b0ed5ef531c95f087ca095d28045f699eaf8))


### Features

* just to force update version and publish ([3201376](https://github.com/mrvmv/sequelize-mig/commit/3201376da91e787a0619edd8c7438f08589d2220))

# [2.6.0](https://github.com/mrvmv/sequelize-mig/compare/v2.5.1...v2.6.0) (2021-01-11)


### Features

* add check for index file exist ([dc23493](https://github.com/mrvmv/sequelize-mig/commit/dc23493a088e01657da51b4beca8c8568726c813))
* add some checks for better error handling ([a1d9ba1](https://github.com/mrvmv/sequelize-mig/commit/a1d9ba1be407c05afc1c37e3aff11a8791fe4a68))
* added a lot of checks for errors and new log ([076932a](https://github.com/mrvmv/sequelize-mig/commit/076932a1ab31acb36311751655a03f889f1486d5))

## [2.5.1](https://github.com/mrvmv/sequelize-mig/compare/v2.5.0...v2.5.1) (2021-01-11)


### Bug Fixes

* example/package.json & example/yarn.lock to reduce vulnerabilities ([587821d](https://github.com/mrvmv/sequelize-mig/commit/587821d26284eea4f9caa1f8fff9f9e23dc0ecc7))

# [2.5.0](https://github.com/mrvmv/sequelize-mig/compare/v2.4.1...v2.5.0) (2020-12-31)


### Features

* Force new release, add sync to readme ([7bdb2b7](https://github.com/mrvmv/sequelize-mig/commit/7bdb2b7e91a169fd859a476ef560df0f8c4f8b37))

## [2.4.1](https://github.com/mrvmv/sequelize-mig/compare/v2.4.0...v2.4.1) (2020-10-30)


### Bug Fixes

* refactor getPartialMigration n fix droptable ([535656c](https://github.com/mrvmv/sequelize-mig/commit/535656cd9eae5af0f014f0b445df54e5a77f7890))

# [2.4.0](https://github.com/mrvmv/sequelize-mig/compare/v2.3.7...v2.4.0) (2020-10-28)


### Bug Fixes

* fix bug in depends checking for null ([90ecfc4](https://github.com/mrvmv/sequelize-mig/commit/90ecfc447c222e44185dcec8319a7f6209d6c1a4))
* fix huge bugs for index and changeColumn ([af2275c](https://github.com/mrvmv/sequelize-mig/commit/af2275cff8daf92c75eac8869c587f4f44bf8bf1))
* writeMigration update consoleOut to consoles ([02abfe8](https://github.com/mrvmv/sequelize-mig/commit/02abfe88edbd47b2f08cd5dfff67257490a9103d))


### Features

* add getFileName to functions for future ([b03e81b](https://github.com/mrvmv/sequelize-mig/commit/b03e81b2a7f5178e7f0187f585eef1f502d48256))
* add migration:undo ([c420177](https://github.com/mrvmv/sequelize-mig/commit/c4201778bdde14704e410f5d9980e7f20a6dada4))

## [2.3.7](https://github.com/mrvmv/sequelize-mig/compare/v2.3.6...v2.3.7) (2020-10-28)


### Bug Fixes

* remove lodash dep and make template native ([88c9feb](https://github.com/mrvmv/sequelize-mig/commit/88c9feb50bdb69aa3eda6aa6a87f7354f5ca2754))


### Performance Improvements

* update assets to new template ([950a832](https://github.com/mrvmv/sequelize-mig/commit/950a832ce391a2d8ff933374672c788f5ed8ce11))

## [2.3.6](https://github.com/mrvmv/sequelize-mig/compare/v2.3.5...v2.3.6) (2020-10-27)


### Bug Fixes

* small fix for action.options not defined ([e66a52e](https://github.com/mrvmv/sequelize-mig/commit/e66a52e28c68b93aa15d20192c733978112d62bc))

## [2.3.5](https://github.com/mrvmv/sequelize-mig/compare/v2.3.4...v2.3.5) (2020-10-27)


### Bug Fixes

* replace currentState.content to perviousState ([c5771a6](https://github.com/mrvmv/sequelize-mig/commit/c5771a61dc4f8193327e1457b08acf75dedf953d))

## [2.3.4](https://github.com/mrvmv/sequelize-mig/compare/v2.3.3...v2.3.4) (2020-10-27)


### Bug Fixes

* try to fix url host problem on linux devices ([9f8da83](https://github.com/mrvmv/sequelize-mig/commit/9f8da830940c37a7fed71d76688530a5d96a4435))

## [2.3.3](https://github.com/mrvmv/sequelize-mig/compare/v2.3.2...v2.3.3) (2020-10-25)


### Bug Fixes

* double type was showing an error ([32f964f](https://github.com/mrvmv/sequelize-mig/commit/32f964fc84a3dcf609ba8a0785c533d24aaae82e))

## [2.3.2](https://github.com/mrvmv/sequelize-mig/compare/v2.3.1...v2.3.2) (2020-10-14)


### Bug Fixes

* remove Optional chaining to support older node versions ([16793a4](https://github.com/mrvmv/sequelize-mig/commit/16793a497a952ca5fe4f40752d09880259db20af))

## [2.3.1](https://github.com/mrvmv/sequelize-mig/compare/v2.3.0...v2.3.1) (2020-10-06)


### Bug Fixes

* addindex, removeindex breaking migrations ([f1a8bfa](https://github.com/mrvmv/sequelize-mig/commit/f1a8bfad2285acbccc48491b1190e6b293d0efbc))
* if now changes in models no error ([f5abc5e](https://github.com/mrvmv/sequelize-mig/commit/f5abc5e9fe712f8b65732894e29e1d9315000259))
* trying some updates to models.js ([a3e1786](https://github.com/mrvmv/sequelize-mig/commit/a3e1786829fa0861bcd092799b67c10cc8337c5b))
* update index.js ([5e33685](https://github.com/mrvmv/sequelize-mig/commit/5e3368517b895ac7dc358ff2c7dfd0e7a128e8cd))

# [2.3.0](https://github.com/mrvmv/sequelize-mig/compare/v2.2.0...v2.3.0) (2020-09-18)


### Bug Fixes

* fix sequelizerc ([1741a5c](https://github.com/mrvmv/sequelize-mig/commit/1741a5cf3cd7b0d28aeb42c0c0eb8775e9141d8a))
* small fix for unused comparisons ([c6472cd](https://github.com/mrvmv/sequelize-mig/commit/c6472cd14818d8ed5c4704dd3af2d84afe50fe3e))


### Features

* add ignore-sequelizerc flag ([cb79b6e](https://github.com/mrvmv/sequelize-mig/commit/cb79b6ea0de3ca11165742fec2e136c2d8c62efb))

# [2.2.0](https://github.com/mrvmv/sequelize-mig/compare/v2.1.2...v2.2.0) (2020-09-16)


### Bug Fixes

* fix for defaultValue check ([19f4af4](https://github.com/mrvmv/sequelize-mig/commit/19f4af4ca791019216edccf259e0a318c72aae71))
* update dep and repair bugs ([1e91034](https://github.com/mrvmv/sequelize-mig/commit/1e91034ece94067af552176249ed62c838e145d5))
* **lib:** add checking to rhs ([602af96](https://github.com/mrvmv/sequelize-mig/commit/602af962860140536fe99e2754fcde1fc386654c))
* **lib:** defaultValue cannot be null ([d10b805](https://github.com/mrvmv/sequelize-mig/commit/d10b80545bd1c4a6f786bf51668c437cc306057a))


### Features

* add custom schemas path other than migration ([a065238](https://github.com/mrvmv/sequelize-mig/commit/a0652383f1a17425f97a2071183a1431b2144e2a))
* add pwd path to change all paths base ([f225e4a](https://github.com/mrvmv/sequelize-mig/commit/f225e4a1eb5a6d930c5a5ce07366ca707619e486))
* Change migration file name to timestamps ([ecf2dc7](https://github.com/mrvmv/sequelize-mig/commit/ecf2dc7214528686e163f4c07a3cb6cdf4cd1f6c))
* **lib:** allow custom datatypes ([1015cd1](https://github.com/mrvmv/sequelize-mig/commit/1015cd1f9eda5602266f0ff03339e195692f0d23))
* **lib:** support blob string length ([f336f86](https://github.com/mrvmv/sequelize-mig/commit/f336f86638efeb50e98586243aa010344e8d441d))
* **lib:** support other array types ([8654b0b](https://github.com/mrvmv/sequelize-mig/commit/8654b0bd1c3501b8d089bf6f716e781051bd794f))
* **lib:** support text string length ([ed561a6](https://github.com/mrvmv/sequelize-mig/commit/ed561a60ebff32ef2a6e02fcdb0bce65944bca0f))

## [2.1.2](https://github.com/mrvmv/sequelize-mig/compare/v2.1.1...v2.1.2) (2020-09-04)


### Bug Fixes

* fix for registry in package json ([a2cab80](https://github.com/mrvmv/sequelize-mig/commit/a2cab80bd2fcc43f9f2254d23812a918a0007a0d))

## [2.1.1](https://github.com/mrvmv/sequelize-mig/compare/v2.1.0...v2.1.1) (2020-09-04)


### Bug Fixes

* add Lgtm grade and other icons for readme ([4eea801](https://github.com/mrvmv/sequelize-mig/commit/4eea801ef8c589b8201c10331aa19b71c2ad64e7))
