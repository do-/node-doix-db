const MockDb = require ('./lib/MockDb.js')

test ('do', async () => {

	const db = new MockDb (), {trackerClass} = db.pool

	const a = []; db.pool = {trackerClass, logger: {log: m => a.push (m.message)}}

	const call = await db.do ('COMMIT')

	expect (call.sql).toBe ('COMMIT')
	expect (call.options.maxRows).toBe (0)
	expect (a).toHaveLength (2)
	expect (a [0]).toMatch (/ > /)
	expect (a [1]).toMatch (/ < /)
	
})

test ('insert', async () => {

	const db = new MockDb () 

	await db.insert ('users', {})
	
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