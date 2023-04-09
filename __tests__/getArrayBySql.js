const MockDb = require ('./lib/MockDb.js')

test ('getArrayBySql', async () => {
		
	const db = new MockDb ()

	expect (await db.getArrayBySql ('SELECT', [], {})).toHaveLength (2)

	expect (await db.getArrayBySql ('SELECT', [], {maxRows: 1, isPartial: true})).toHaveLength (1)

	await expect (db.getArrayBySql ('SELECT', [], {maxRows: 1})).rejects.toThrow ()

	
})


