const {Readable, Transform} = require ('stream')
const DbCall = require ('../lib/DbCall.js')
const MockDb = require ('./lib/MockDb.js')

const SAMPLE_RECORDS = [
	{id: 1, label: 'one'},
	{id: 2, label: 'two'},
	{id: 3, label: 'three'},
]

test ('bad', () => {

	expect (() => new DbCall ()).toThrow ('db')
	
	const db = new MockDb ()

	expect (() => db.call ()).toThrow ('sql')
	expect (() => db.call (0)).toThrow ('sql')
	expect (() => db.call ('SELECT 1', [], {checkOverflow: true})).toThrow ('checkOverflow')
	expect (() => db.call ('SELECT 1', [], {maxRows: 1000, checkOverflow: 1})).toThrow ('checkOverflow')
	expect (() => db.call ('SELECT 1', [], {maxRows: '1000'})).toThrow ('maxRows')
	expect (() => db.call ('SELECT 1', [], {maxRows: -1})).toThrow ('maxRows')
	expect (() => db.call ('SELECT 1', [], {rowMode: 'object'})).toThrow ('rowMode')
	expect (() => db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'map'})).toThrow ('rowMode')

})

test ('construct', () => {

	const db = new MockDb ()

	expect (db.call ('SELECT 1')).toBeInstanceOf (DbCall)
	expect (db.call ('SELECT 1', [], {maxRows: 1000}).objectMode).toBe (true)
	expect (db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'array'}).options.rowMode).toBe ('array')
	expect (db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'array'}).options.checkOverflow).toBe (false)

})

test ('finish', () => {

	const db = new MockDb (), cl = db.call ('SELECT 1')

	let cnt = 0; cl.on ('finish', () => cnt ++)

	cl.finish ()
	cl.finish ()

	expect (cnt).toBe (1)

})

test ('flattenArray', () => {

	const db = new MockDb (), cl = db.call ('SELECT 1')

	cl.rows = [[1], [2], [3]]

	cl.flattenArray ()

	expect (cl.rows).toStrictEqual ([1, 2, 3])

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

test ('fetchArray error', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 1000})

	cl.rows = Readable.from (SAMPLE_RECORDS)
	
	.pipe (new Transform ({
		objectMode: true,
		highWaterMark: 1,
		transform (r, __, cb) {
			if (r.id == 1) return cb (null, r)
			cb (Error ('test'))
		}		
	}))

	await expect (cl.fetchArray ()).rejects.toThrow ()

})

test ('fetchArray ok', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 1000})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await cl.fetchArray ()

	expect (cl.rows).toStrictEqual (SAMPLE_RECORDS)

})

test ('fetchArray maxRows', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 2})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await cl.fetchArray ()

	expect (cl.rows).toStrictEqual ([
		{id: 1, label: 'one'},
		{id: 2, label: 'two'},
	])

})

test ('fetchArray checkOverflow ok', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 3, checkOverflow: true})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await cl.fetchArray ()

	expect (cl.rows).toStrictEqual (SAMPLE_RECORDS)

})

test ('fetchArray checkOverflow error', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 2, checkOverflow: true})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await expect (cl.fetchArray ()).rejects.toThrow ()

})

test ('flattenStream', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 1000})

	cl.rows = Readable.from ([[1], [2]])

	cl.flattenStream ()

	await cl.fetchArray ()

	expect (cl.rows).toStrictEqual ([1, 2])

})