const {ConsoleLogger} = require ('doix')
const {DbPool, DbLang, DbModel, DbCallTracker, DbRelation, DbTable, DbView} = require ('..')
const Path = require ('path')
const EventEmitter = require ('events')

const src = Path.join (__dirname, 'data', 'root1')

test ('pojo', () => {

	const pool = new DbPool ({trackerClass: Object})

	expect (pool.trackerClass).toBe (Object)

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
	expect (pool.trackerClass).toBe (DbCallTracker)
		
	const job = new EventEmitter ()
	
	pool.acquire = () => ({})
	pool.wrapper = EventEmitter
		
	await pool.toSet (job, 'db')
	
	expect (job.db.model).toBe (model)
	expect (job.db.lang).toBe (pool.lang)
	
	const roles = model.find ('roles')

	expect (roles.qName).toBe ('"roles"')
	expect (roles.columns.id.qName).toBe ('"id"')

	const cnt = clazz => {

		let n = 0

		for (const i of model.defaultSchema.map.values ()) if (i instanceof clazz) n ++

		return n

	}

	expect (cnt (DbRelation)).toBe (4)
	expect (cnt (DbTable)).toBe (3)
	expect (cnt (DbView)).toBe (1)

})