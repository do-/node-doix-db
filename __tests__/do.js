const MockDb = require ('./lib/MockDb.js')
const DbCall = require ('../lib/DbCall.js')

test ('misc', async () => {

	const db = new MockDb ()

	await expect (db.do (1)).rejects.toThrow ()
	await expect (db.do ({})).rejects.toThrow ()
	await expect (db.do ([])).rejects.toThrow ()
	await expect (db.do (['SELECT', 'SELECT', 'SELECT'])).rejects.toThrow ()

})


test ('do', async () => {

	const db = new MockDb (), {trackerClass} = db.pool

	expect (db.txn).toBeNull ()

	const a = []; db.pool = {trackerClass, logger: {log: m => a.push (m.message)}}

	const call = await db.do ({sql: 'COMMIT', params: []})

	expect (call.sql).toBe ('COMMIT')
	expect (call.options.maxRows).toBe (0)
	expect (a).toHaveLength (2)
	expect (a [0]).toMatch (/ > /)
	expect (a [1]).toMatch (/ < /)
	
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