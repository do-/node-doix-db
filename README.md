![workflow](https://github.com/do-/node-doix-db/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

`doix-db` is an extension to the [doix](https://github.com/do-/node-doix) framework for working with [relational databases](https://en.wikipedia.org/wiki/Relational_database). 

# tl;dr

Start a trivial Web service project with [doix-http](https://github.com/do-/node-doix-http/wiki), add a connection to [PostgreSQL](https://github.com/do-/node-doix-db-postgresql/wiki#tldr) or to [ClickHouse](https://github.com/do-/node-doix-db-clickhouse/wiki#tldr) and hack on.

# Description

Basically, this is the common [RDB](https://en.wikipedia.org/wiki/Relational_database) interface for `doix`, the same as ODBC for Windows, JDBC for Java and so on.

Aside from processing given statements, it features some SQL generation capabilities.

# Connection & Basic Operation

For an [Application](https://github.com/do-/node-doix/wiki/Application) to operate on a database, you have to register therein the properly configured vendor specific [`DbPool`](https://github.com/do-/node-doix-db/wiki/DbPool):

```js
const {DbPoolPg} = require ('doix-db-postgresql')
// const {DbPoolCh} = require ('doix-db-clickhouse')

   const db        = new DbPoolPg (conf.db)
// const dbArchive = new DbPoolCh (conf.dbArchive)

///...
      pools: {
        db,       
//      dbArchive,
      },
///...
```

Then, corresponding [`DbClient`](https://github.com/do-/node-doix-db/wiki/DbClient) instances will be automatically [injected](https://github.com/do-/node-doix/wiki#dependency-injection) in execution contexts:

```js
const dt = await this.db.getScalar ('SELECT CURRENT_DATE')
//         await this.dbArchive.do ('ALTER TABLE facts DROP PARTITION ?', [dt])
```

Asynchronous methods can be called right away; initialization and cleanup are up to `doix` internals.

Just in case, the hosting application is always in hand, with all its internals, including the `pools` [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), so developers may operate on it directly, at their own risk:

```js
this.app.pools.get ('db').pool.end () // see https://node-postgres.com/apis/pool#poolend
```

## Executing Arbitrary SQL
[`DbClient`](https://github.com/do-/node-doix-db/wiki/DbClient)'s most common methods are:
* [`do`](https://github.com/do-/node-doix-db/wiki/DbClient#do-q-p-options) for write only [DML](https://en.wikipedia.org/wiki/Data_manipulation_language)/[DDL](https://en.wikipedia.org/wiki/Data_definition_language) commands;
* [`get***` family](https://github.com/do-/node-doix-db/wiki/DbClient#data-fetching) for `SELECT` and other data returning requests.

The API is designed to be versatile yet concise. Each request is invoked by a single call; scalars, arrays and streams are represented uniformly.

In result sets, the primitive types mapping depends on the specific driver, but, in general, when ambiguous, strings are used. In particular:
* fixed precision numbers (`DECIMAL` etc.) are returned as [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)s, never by [`Number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)s to avoid rounding errors;
* dates are represented by [ISO](https://en.wikipedia.org/wiki/ISO_8601) strings, never by [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)s, because of time zone related issues.

For bound parameters, contrarily, `doix-db` accepts nearly everything and do the best to map it properly in an intuitive way. It's recommended however to 
provide all values but safe integers in the string form.

Like every process in `doix`, each SQL statement execution is transparently [logged](https://github.com/do-/node-doix/wiki#logging), with references to the containing [`job`](https://github.com/do-/node-doix/wiki/Job).

# Using a Database Model

Far from embracing the [MDA](https://en.wikipedia.org/wiki/Model-driven_architecture) approach in its totality, `doix-db` is developed keeping in mind that an application must be aware of, and effectively use meta information about data structures in operates on. Even more, a well designed application must keep the image of the _required_ structure of its database and should be able to compare it to the actual one, maybe outdated, and to _upgrade_ it according to requirements: primarily, with automatic migrations during deployments.

To this end, `doix-db` offers a means to load the presumed database schemata from source files next to the [`Application`](https://github.com/do-/node-doix/wiki/Application)'s modules.

## Setting Up, Exploring Content
Each database object, such as a [table](https://github.com/do-/node-doix-db/wiki/DbTable), [sql view](https://github.com/do-/node-doix-db/wiki/DbView) and so on, must be described by an eponymous [module](https://nodejs.org/api/modules.html). Suppose you have all necessary modules in a directory called` /path/to/the/model`. To make use of this information, you have to associate it with the corresponding pool on application start (here, we suppose the `db` and `dbArchive` variables are the same as in the example above):

```js
const {DbModel} = require ('doix-db')

// simple case:
new DbModel ({db, src: [{root: `/path/to/the/model`}]}).loadModules ()

// advanced usage:
{
  const dbModel = new DbModel ({dbArchive, src: [{root: `/path/to/the/model`}]})
//  dbModel.on ('objects-created', function () {/*...*/}) // after resolveReferences ()
//  dbModel.prependListener ('objects-created', function () {/*...*/}) // before
  dbModel.loadModules ()
}
```

Now both pools, and each [`DbClient`](https://github.com/do-/node-doix-db/wiki/DbClient) acquired, will have corresponding [`.model`](https://github.com/do-/node-doix-db/wiki/DbModel) properties injected therein. For simple tasks, you can use them like this:

```js
const {data: {length}} = this.db.model.find ('dim.gender')   // known table, mandatory fixed content
this.logger.log ({message: `We suppose there are ${length} genders`})

const tmpTables = []; for (const o of this.db.model.objects) // iterate over schemata
  if (o instanceof DbTable && o.isToPurge)                   // check for a custom tag
    tmpTables.push (o.qName)
if (tmpTables.length !== 0)
  await db.do (`TRUNCATE ${tmpTables}`)
```
More advanced API is covered below.

## NOSQL: Not Only SQL
### Document Oriented API
Given a table name and its primary key value(s), you can fetch the single record without coding SQL:

```js
const user = await this.db.getObject ('users', [id]
// , {notFound: {id: 0}} // fail safe demo, just in case
)
```

It may look similar to some other frameworks functionality, namely [Sequelize](https://sequelize.org/docs/v6/core-concepts/model-querying-finders/#findbypk), but let's underline that `doix-db` <u>is by no means an</u> [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping) framework. In this section, records are represented by plain objects, not strictly typed ones. No such ORMish things here as _eager/lazy loading_, _detached state_ etc.

To save a given record in a given table, [insert](https://github.com/do-/node-doix-db/wiki/DbClient#insert-tablename-records-options), [update](https://github.com/do-/node-doix-db/wiki/DbClient#update-tablename-record-options) and [upsert](https://github.com/do-/node-doix-db-postgresql/wiki/DbClientPg#upsert-tablename-record-options) are available:

```js
await this.db.insert ('log', {id: 1, message: 'Test', level: 1}, {
// onlyIfMissing: true // ON CONFLICT DO NOTHING, PostgreSQL only
// result: 'record'    // what to return, PostgreSQL too
})
await this.db.update ('log', {id: 1, message: 'The test'})
await this.db.upsert ('user_options', {id_user: 1, id_option: 10, value: true}, {
//  key: ['id_user', 'id_option'] // if differs from the primary key
})
```
Naturally, field names must match. Extra properties unknown to the data model are silently ignored. Although not recommended for mission critical high load operations, this technique can save a lot of time while prototyping a simple CRUD functionality.

For developer's convenience, the umbrella `insert` method, aside from processing single records, features the mass loading. It accepts arrays:
```js
await this.db.insert ('log', [
  {id: 2, message: 'Two'},
  {id: 3, message: 'Three'},
])
```
and [object streams](https://nodejs.org/api/stream.html#object-mode):
```js
const objectStream = await this.db.getStream (`SELECT * FROM vw_sales_to_archive`)
await this.dbArchive.insert ('sales', objectStream)
```
For maximal performance, native database streams are used whenever possible.

### Dynamic Search Queries

Most user interfaces (especially, Web ones) contain scrollable roasters with multiple search fields. Commonly, most of filters are unset by default, and empty values must be ignored. 

In this situation, the SQL query is better generated based on the actual set of search terms requested: at least the `WHERE` clause, but quite often the `FROM` part too, may be some others. And to display a page counter, a secondary `SELECT COUNT(*)` is needed, with a specific optimization (excluding `ORDER BY`, omitting some `OUTER JOIN`s, etc.)

To facilitate the code generation is most such cases, `doix-db` features a [dynamic query builder](https://github.com/do-/node-doix-db/wiki/DbQuery). Unlike some well known analogs (e. g. [Knex.js](https://knexjs.org/guide/query-builder.html)), its API doesn't mock a SQL AST in form of multiple chained method calls.

From the application perspective, given a set of filters in form of a plain object, it takes a single [`this.db.model.createQuery ()`](https://github.com/do-/node-doix-db/wiki/DbModel#createquery) call to obtain a builder instance and immediately pass it as a parameter to [this.db.getArray ()](https://github.com/do-/node-doix-db/wiki/DbClient#getarray-q-p-options).

```js
const q = this.db.model.createQuery (
  [['notes', {filters: [['txt', 'ILIKE', '%' + v + '%']]}]],
  {order: 'created', limit: 50, offset: 0}
)
, range = await this.db.getArray (q)       // LIMIT / OFFSET applied
, count = selection [Symbol.for ('count')] // extra COUNT(*) result
```

But what is the right structure for that _set of filters_ mentioned above? Surprisingly, no common standard for this is in sight. Every DHTML AJAX library featuring some advanced data grid seems to invent its own one: the same thing once expressed as `filter: ['label', 'startswith', 'admin']`, looks like `search: [{field: 'label', operator: 'begins', value: 'admin'}]` elsewhere and so on.

They are all pretty similar though, those micro languages. No problem to translate from one to another, more versatile one (the `doix-db` one, that is). Two translators of this kind are available: [for DevExtreme](https://github.com/do-/node-doix-devextreme) and [for w2ui](https://github.com/do-/node-doix-w2ui) frameworks. More can be cloned easily.

## Planning and Performing Migrations

The aforementioned [Sequelize](https://sequelize.org/docs/v6/other-topics/migrations/#running-migrations) and [Knex.js](https://knexjs.org/guide/migrations.html) both offer tools to automate database migrations, very similar to ones implemented by [Liquibase](https://www.npmjs.com/package/liquibase) and [Flyway](https://www.npmjs.com/package/node-flywaydb) both ported from the Java universe. In all those cases, developers code migration steps in an imperative manner, and the framework assembles those fragments in a sequence based on initial and final version numbers.

`doix-db` takes a completely different approach to the same problem. It features [`DbMigrationPlan`](https://github.com/do-/node-doix-db/wiki/DbMigrationPlan): a diff/patch like tool comparing the actual physical database structure to the required one and generating necessary DDL statements.

```js
const plan = this.db.createMigrationPlan ()

  // plan.on (..., ...)              // ...set custom event handlers

await plan.loadStructure ()          // read the INFORMATION_SCHEMA

  // ...adjust something, based on plan.asIs

plan.inspectStructure ()             // compare with this.db.model

  // ...adjust something more, based on plan.toDo

await this.db.doAll (plan.genDDL ()) // execute (or maybe just record plan.genDDL ())
```

So, in essence, `doix-db`'s `DbMigrationPlan` vs. Liquibase like tools is [closed loop vs. open loop](https://en.wikipedia.org/w/index.php?title=Control_loop&oldid=1281798171#Open-loop_and_closed-loop) control.

## Ensuring Fixed Data

It's quite a common case to have several relational tables only filled up with few known records each. These are dictionaries of values like system roles, document status etc. They need to be kept in the database to be available for `JOIN`s, but in fact are application constants.

In `doix-db`, such fixed content is normally added to [table definitions](https://github.com/do-/node-doix-db/wiki/DbTable)

```js
...
    data: [
        {id: 1, name: 'admin'},
        {id: 2, name: 'user'},
    ],
...
```
what guarantees it to be present in the table (via [`DbMigrationPlan`](https://github.com/do-/node-doix-db/wiki/DbMigrationPlan)) and makes it visible to the application code.

When developing AJAX backends, a frequent task is to augment an object representing a data record with some dictionaries for its fields. For sure such data must be taken right from the application's memory rather than fetched from the database:

```js
const user = await this.db.getObject ('users', [id])
user.roles = this.db.model.find ('roles').data
user.status = this.db.model.find ('status').data
//...
return user 
```

And there is some [API sugar](https://github.com/do-/node-doix-db/wiki/DbModel#assigndata) for this:
```js
return this.db.model.assignData (
  await this.db.getObject ('users', [id]),
  [
    'roles',
    'status',
  ]
)
```

More information is available at https://github.com/do-/node-doix-db/wiki
