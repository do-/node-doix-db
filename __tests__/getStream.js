const MockDb = require ('./lib/MockDb.js')

test ('getStream', async () => {
		
	const db = new MockDb (), is = await db.getStream ('SELECT *')

	const a = []; for await (const r of is) a.push (r)

	expect (a).toHaveLength (2)
	expect (is [Symbol.for ('call')].sql).toBe ('SELECT *')
	
})


