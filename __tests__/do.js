const MockDb = require ('./lib/MockDb.js')

test ('do', async () => {

	const db = new MockDb (), call = await db.do ('COMMIT')

	expect (call.sql).toBe ('COMMIT')
	expect (call.options.maxRows).toBe (0)
	
})

