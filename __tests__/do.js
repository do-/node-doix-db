const MockDb = require ('./lib/MockDb.js')
const DbCall = require ('../lib/DbCall.js')

const {Writable} = require ('stream')
const winston = require ('winston')

test ('misc', async () => {

	const db = new MockDb ()

	await expect (db.do (1)).rejects.toThrow ()
	await expect (db.do ({})).rejects.toThrow ()
	await expect (db.do ([])).rejects.toThrow ()
	await expect (db.do (['SELECT', 'SELECT', 'SELECT'])).rejects.toThrow ()

})


test ('do', async () => {

	const db = new MockDb ()

	let s = ''

	const stream = new Writable ({
		write (r, _, cb) {
			s += r.toString ()
			cb ()
		}
		
	})

	const tr = new winston.transports.Stream ({
		stream,
		format: winston.format.printf ((i => `${i.id} ${i.event === 'finish' ? i.elapsed + ' ms' : i.message}${i.details ? ' ' + JSON.stringify (i.details.params) : ''}`))
	})
	
	db.pool.logger.add (tr)

	expect (db.txn).toBeNull ()

	const call = await db.do ({sql: 'COMMIT', params: []})

	const a = s.trim ().split ('\n').map (s => s.trim ())

	db.pool.logger.remove (tr)

	expect (call.sql).toBe ('COMMIT')
	expect (call.options.maxRows).toBe (0)
	expect (a).toHaveLength (2)
	expect (a [0]).toBe ('1/2/db/1 COMMIT []')
	expect (a [1]).toMatch (/^1\/2\/db\/1 \d+ ms$/)
})

test ('insert', async () => {

	const db = new MockDb () 

	const r = await db.insert ('users', {})

	expect (r).toBeInstanceOf (DbCall)

})

test ('update', async () => {

	const db = new MockDb () 

	await db.update ('users', {uuid: 1})
	await db.update ('users', {uuid: 1, label: '1'})
	
})

test ('createTempTable', async () => {

	const db = new MockDb () 

	await db.createTempTable ('users', {onlyIfMissing: true})
	await db.createTempTable (db.model.find ('users'), {})
	
})