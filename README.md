![workflow](https://github.com/do-/node-doix-db/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

# node-doix-db
`doix-db` is a plug in for [doix](https://github.com/do-/node-doix) framework implementing a common interface to relational databases. It features:
* [DbClient](https://github.com/do-/node-doix-db/wiki/DbClient) — the database API available to `doix` [Job](https://github.com/do-/node-doix/wiki/Job)s;
* [DbModel](https://github.com/do-/node-doix-db/wiki/DbModel) — the set of classes representing the database structure;
* [DbQuery](https://github.com/do-/node-doix-db/wiki/DbQuery) — a `DbModel` based `SELECT` builder;
* [DbMigrationPlan](https://github.com/do-/node-doix-db/wiki/DbMigrationPlan) — a `DbModel` based deployment automation tool;
* [DbLang](https://github.com/do-/node-doix-db/wiki/DbLang) — a set of SQL generating functions for miscellaneous application tasks.

Has backends for 
* [PostgreSQL](https://github.com/do-/node-doix-db-postgresql),
* [ClickHouse](https://github.com/do-/node-doix-db-clickhouse).

More information is available at https://github.com/do-/node-doix-db/wiki
