const MockDb = require ('./lib/MockDb.js')

test ('getObject', async () => {

	const db = new MockDb ()
	
	expect (await db.getObject ('')).toStrictEqual ({})

	const DEF = {1: 0}

	expect (await db.getObject ('', [], {notFound: DEF})).toBe (DEF)
	
	await expect (db.getObject ('', [], {notFound: Error (1)})).rejects.toThrow ()
	
})

