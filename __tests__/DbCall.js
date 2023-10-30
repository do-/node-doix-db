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
	expect (() => db.call ('SELECT 1', [], {notFound: '1000'})).toThrow ('notFound')
	expect (() => db.call ('SELECT 1', [], {maxRows: -1})).toThrow ('maxRows')
	expect (() => db.call ('SELECT 1', [], {rowMode: 'object'})).toThrow ('rowMode')
	expect (() => db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'map'})).toThrow ('rowMode')
	expect (() => db.call ('SELECT 1', [], {minRows: 1})).toThrow ('minRows')
	expect (() => db.call ('SELECT 1', [], {minRows: -1, maxRows: 1000})).toThrow ('minRows')
	expect (() => db.call ('SELECT 1', [], {minRows: '1', maxRows: 1000})).toThrow ('minRows')
	expect (() => db.call ('SELECT 1', [], {minRows: 1001, maxRows: 1000})).toThrow ('minRows')
	expect (() => db.call ('SELECT 1', [], {minRows: 1, maxRows: Infinity})).toThrow ('minRows')

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

	cl.rows = []

	cl.processArray ()
	cl.finish ()
	cl.finish ()

	expect (cnt).toBe (1)

})

test ('flattenArray', () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'scalar'})

	cl.rows = [[1], [2], [3]]

	let cnt = 0; cl.on ('finish', () => cnt ++)

	cl.processArray ()

	expect (cl.rows).toStrictEqual ([1, 2, 3])
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

test ('fetchStream error', async () => {

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

	cl.observeStream ()

	let cnt = 0; cl.on ('error', () => cnt ++)

	await expect (cl.fetchStream ()).rejects.toThrow ()

	expect (cnt).toBe (1)

})

test ('fetchStream ok', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 1000})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await cl.fetchStream ()

	expect (cl.rows).toStrictEqual (SAMPLE_RECORDS)

})

test ('fetchStream maxRows', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 2})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await cl.fetchStream ()

	expect (cl.rows).toStrictEqual ([
		{id: 1, label: 'one'},
		{id: 2, label: 'two'},
	])

})

test ('fetchStream checkOverflow ok', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 3, checkOverflow: true})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await cl.fetchStream ()

	expect (cl.rows).toStrictEqual (SAMPLE_RECORDS)

})

test ('fetchStream checkOverflow error', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 2, checkOverflow: true})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	await expect (cl.fetchStream ()).rejects.toThrow ()

})

test ('flattenStream', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: 1000, rowMode: 'scalar'})

	cl.rows = Readable.from ([[1], [2]])

	let cnt = 0; cl.on ('finish', () => cnt ++)

	cl.processStream ()
	await cl.fetchStream ()

	expect (cl.rows).toStrictEqual ([1, 2])

	expect (cnt).toBe (1)

})

test ('processStream ok', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {maxRows: Infinity})

	cl.rows = Readable.from (SAMPLE_RECORDS)

	let cnt = 0; cl.on ('finish', () => cnt ++)

	await cl.processStream ()

	expect (cnt).toBe (0)

	await cl.fetchStream ()

	expect (cl.rows).toStrictEqual (SAMPLE_RECORDS)

	expect (cnt).toBe (1)

})

test ('processStream error', async () => {

	const db = new MockDb (), cl = db.call ('SELECT 1', [], {
		maxRows: 1000, 
		rowMode: 'scalar'
	})

	cl.rows = Readable.from (SAMPLE_RECORDS)
	.pipe (new Transform ({
		objectMode: true,
		highWaterMark: 1,
		transform (r, __, cb) {			
			if (r.id == 1) return cb (null, r)
			cb (Error ('test'))
		}		
	}))
	
	cl.processStream ()

	let err = 0; cl.on ('error', () => err ++)

	await expect (cl.fetchStream ()).rejects.toThrow ()

	expect (err).toBe (1)

})

test ('exec', async () => {

	const db = new MockDb ()

	{
		const cl = await db.call ('', [])
		await expect (cl.exec ()).rejects.toThrow ()
	}

	{
		const cl = await db.call ('SELECT *', [], {maxRows: 0})
		const r = await cl.exec ()
		expect (r).toBeUndefined ()
	}

	{
		const cl = await db.call ('SELECT *', [], {maxRows: Infinity})
		const r = await cl.exec ()
		expect (r).toBeInstanceOf (Readable)
	}

	{
		const cl = await db.call ('SELECT *', [], {maxRows: 3})
		const r = await cl.exec ()
		expect (r [0].id).toBe (1)
	}

	{
		const cl = await db.call ('SELECT *', [], {maxRows: 1})
		const r = await cl.exec ()
		expect (r.id).toBe (1)
	}

	{
		const cl = await db.call ('SELECT *', [], {maxRows: 1000, minRows: 2})
		const r = await cl.exec ()
		expect (r [0].id).toBe (1)
	}

	{
		const cl = await db.call ('SELECT *', [], {maxRows: 1000, minRows: 3})
		await expect (cl.exec ()).rejects.toThrow ()
	}

	{
		const notFound = {}
		const cl = await db.call ('SELECT *', [], {maxRows: 1000, minRows: 3, notFound})
		const r = await cl.exec ()
		expect (r).toBe (notFound)
	}

})