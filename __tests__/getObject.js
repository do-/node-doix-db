const MockDb = require ('./lib/MockDb.js')

test ('getObject', async () => {

	const db = new MockDb ()
	
	expect (await db.getObject ('0')).toStrictEqual ({})

	expect (await db.getScalar ('SELECT NULL')).toBeNull ()

	const DEF = {1: 0}

	expect (await db.getObject ('0', [], {notFound: DEF})).toBe (DEF)
	
	await expect (db.getObject ('0', [], {notFound: Error (1)})).rejects.toThrow ()
	
})

