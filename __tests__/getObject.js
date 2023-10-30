const MockDb = require ('./lib/MockDb.js')

test ('getObject', async () => {

	const db = new MockDb ()
	
	expect (await db.getScalar ('SELECT NULL')).toBeNull ()

	const DEF = {1: 0}

	expect (await db.getObject ('0', [], {notFound: DEF})).toBe (DEF)
	
	await expect (db.getObject ('0', [], {notFound: Error (1)})).rejects.toThrow ()

	const a = []; db.pool.logger.log = m => a.push (m.message)

	expect (await db.getObject ('roles', [1])).toStrictEqual ({id: 1, name: 'admin', label: 'System Administrator'})

	expect (a).toHaveLength (2)
	expect (a [0]).toMatch (/SELECT.*FROM.*"roles".*WHERE.*"id" = \? \[1\]$/)

	db.model = undefined

	expect (await db.getObject ('0')).toStrictEqual ({})

})

