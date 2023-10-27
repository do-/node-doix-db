const DbCall = require ('../lib/DbCall.js')
const MockDb = require ('./lib/MockDb.js')

test ('bad', () => {

	expect (() => new DbCall ()).toThrow ('db')
	
	const db = new MockDb ()

	expect (() => db.call ()).toThrow ('sql')
	expect (() => db.call (0)).toThrow ('sql')
	expect (() => db.call ('SELECT 1', [], {maxRows: '1000'})).toThrow ('maxRows')
	expect (() => db.call ('SELECT 1', [], {maxRows: -1})).toThrow ('maxRows')
	expect (() => db.call ('SELECT 1', [], {rowMode: 'object'})).toThrow ('rowMode')

})

test ('construct', () => {

	const db = new MockDb ()

	expect (db.call ('SELECT 1')).toBeInstanceOf (DbCall)
	expect (db.call ('SELECT 1', [], {maxRows: 1000}).options.rowMode).toBe ('object')
	expect (db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'array'}).options.rowMode).toBe ('array')

})

test ('finish', () => {

	const db = new MockDb (), cl = db.call ('SELECT 1')

	let cnt = 0; cl.on ('finish', () => cnt ++)

	cl.finish ()
	cl.finish ()

	expect (cnt).toBe (1)

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