const MockDb = require ('./lib/MockDb.js')

test ('getArrayOnly', async () => {
		
	const db = new MockDb ()

	expect (await db.getArrayOnly ('SELECT', [], {})).toHaveLength (2)

	expect (await db.getArrayOnly ('SELECT', [], {maxRows: 1})).toHaveLength (1)

	await expect (db.getArrayOnly ('SELECT', [], {maxRows: 1, checkOverflow: true})).rejects.toThrow ()

	
})


