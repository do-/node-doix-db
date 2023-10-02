const {ConsoleLogger} = require ('doix')
const {DbPool, DbLang, DbModel, DbEventLogger, DbRelation, DbTable, DbView} = require ('..')
const Path = require ('path')
const EventEmitter = require ('events')

const src = Path.join (__dirname, 'data', 'root1')

test ('pojo', () => {

	const pool = new DbPool ({eventLoggerClass: Object})

	expect (pool.eventLoggerClass).toBe (Object)

})

test ('model', async () => {

	jest.resetModules ()

	const logger = ConsoleLogger.DEFAULT

	const pool = new DbPool ({logger})
	
	pool.lang = new DbLang ()

	const model = new DbModel ({src, db: pool})

	model.loadModules ()

	expect (model.db).toBe (pool)

	expect (pool.model).toBe (model)
	expect (pool.logger).toBe (logger)
	expect (pool.eventLoggerClass).toBe (DbEventLogger)
		
	const job = new EventEmitter ()
	
	pool.acquire = () => ({})
	pool.wrapper = EventEmitter
		
	await pool.toSet (job, 'db')
	
	expect (job.db.model).toBe (model)
	expect (job.db.lang).toBe (pool.lang)
	
	const roles = model.map.get ('roles')
	const users = model.map.get ('users')

	expect (roles.qName).toBe ('"roles"')
	expect (roles.columns.id.qName).toBe ('"id"')

	const cnt = clazz => {

		let n = 0

		for (const i of model.map.values ()) if (i instanceof clazz) n ++

		return n

	}

	expect (cnt (DbRelation)).toBe (4)
	expect (cnt (DbTable)).toBe (3)
	expect (cnt (DbView)).toBe (1)

})