const DbCall = require ('../lib/DbCall.js')
const MockDb = require ('./lib/MockDb.js')

test ('bad', () => {

	expect (() => new DbCall ()).toThrow ('db')
	
	const db = new MockDb ()

	expect (() => db.call ()).toThrow ('sql')
	expect (() => db.call (0)).toThrow ('sql')

})

test ('construct', () => {

	const db = new MockDb ()

	expect (db.call ('SELECT 1')).toBeInstanceOf (DbCall)

})

test ('normalizeSQL', () => {

	const db = new MockDb ()

	{
		const c = db.call ('  ')
		db.lang.normalizeSQL (c)
		expect (c.sql).toBe ('')
	}

	{
		const c = db.call (`
	
			SELECT
				1
			FROM 
				DUAL
		
		`)
		db.lang.normalizeSQL (c)
		expect (c.sql).toBe ('SELECT 1 FROM DUAL')
	}

})