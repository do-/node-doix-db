const {ConsoleLogger} = require ('doix')
const {DbPool, DbModel, DbEventLogger} = require ('..')
const Path = require ('path')
const EventEmitter = require ('events')

const r = () => ['root1'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	live: false,
}

test ('pojo', () => {

	const pool = new DbPool ({eventLoggerClass: Object})

	expect (pool.eventLoggerClass).toBe (Object)

})

test ('model', async () => {

	jest.resetModules ()

	const logger = ConsoleLogger.DEFAULT

	const pool = new DbPool ({logger})

	const model = new DbModel ({dir, db: pool})

	model.loadModules ()

	expect (model.db).toBe (pool)

	expect (pool.model).toBe (model)
	expect (pool.globals.model).toBe (model)
	expect (pool.logger).toBe (logger)
	expect (pool.eventLoggerClass).toBe (DbEventLogger)
		
	const job = new EventEmitter ()
	
	pool.acquire = () => ({})
	pool.wrapper = EventEmitter
		
	await pool.toSet (job, 'db')
	
	expect (job.db.model).toBe (model)

})
