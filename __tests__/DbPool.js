const {DbPool, DbLang, DbModel, DbCallTracker, DbRelation, DbTable, DbView} = require ('..')
const Path = require ('path')
const EventEmitter = require ('events')

const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console (),
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})


const src = Path.join (__dirname, 'data', 'root1')

test ('model', async () => {

	jest.resetModules ()

	class MyPool extends DbPool {
		constructor () {
			super ({logger})
		}
		async onAcquire (db) {
			super.onAcquire (db)
			db.__f = true
		}
	}
	const pool = new MyPool

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
	
	expect (job.db.__f).toBe (true)
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