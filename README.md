![workflow](https://github.com/do-/node-doix-db/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

# node-doix-db
`doix-db` is a plug in for [doix](https://github.com/do-/node-doix) framework implementing a common interface to relational databases. It features:
* [DbClient](DbClient) — the database API available to `doix` [Job](https://github.com/do-/node-doix/wiki/Job)s;
* [DbModel](DbModel) — the set of classes representing the database structure;
* [DbQuery](DbQuery) — a `DbModel` based `SELECT` builder;
* [DbMigrationPlan](DbMigrationPlan) — a `DbModel` based deployment automation tool;
* [DbLang](DbLang) — a set of SQL generating functions for miscellaneous application tasks.

* More information is available at https://github.com/do-/node-doix-db/wiki
