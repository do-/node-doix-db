const MockDb = require ('./lib/MockDb.js')
const {Readable, Writable} = require ('stream')

test ('misc', async () => {

	const db = new MockDb ()

	expect (db.batch ()).toBeInstanceOf (Writable)

	await expect (db.doAll (1)).rejects.toThrow ()
	await expect (db.doAll (null)).rejects.toThrow ()
	await expect (db.doAll ({})).rejects.toThrow ()

})


test ('doAll array', async () => {

	const db = new MockDb (), {trackerClass} = db.pool

	const a = []; db.pool = {trackerClass, logger: {log: m => a.push (m.message)}}

	await db.doAll ([
		'COMMIT',
		['COMMIT'],
	])

	expect (a).toHaveLength (4)
	expect (a [0]).toMatch (/ > /)
	expect (a [1]).toMatch (/ < /)
	expect (a [2]).toMatch (/ > /)
	expect (a [3]).toMatch (/ < /)
	
})

test ('doAll stream', async () => {

	const db = new MockDb (), {trackerClass} = db.pool

	const a = []; db.pool = {trackerClass, logger: {log: m => a.push (m.message)}}

	await db.doAll (Readable.from ([
		['COMMIT', []],
		{sql: 'COMMIT'},
	]))

	expect (a).toHaveLength (4)
	expect (a [0]).toMatch (/ > /)
	expect (a [1]).toMatch (/ < /)
	expect (a [2]).toMatch (/ > /)
	expect (a [3]).toMatch (/ < /)
	
})