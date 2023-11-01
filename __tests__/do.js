const MockDb = require ('./lib/MockDb.js')

test ('do', async () => {

	const db = new MockDb (), call = await db.do ('COMMIT')

	expect (call.sql).toBe ('COMMIT')
	expect (call.options.maxRows).toBe (0)
	
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