const MockDb = require ('./lib/MockDb.js')
const {Readable, Writable} = require ('stream')
const winston = require ('winston')

test ('misc', async () => {

	const db = new MockDb ()

	expect (db.batch ()).toBeInstanceOf (Writable)

	await expect (db.doAll (1)).rejects.toThrow ()
	await expect (db.doAll (null)).rejects.toThrow ()
	await expect (db.doAll ({})).rejects.toThrow ()

})


test ('doAll array', async () => {

	const db = new MockDb ()

//	const a = [];

	let s = ''

	const stream = new Writable ({
		write (r, _, cb) {
			s += r.toString ()
			cb ()
		}
		
	})

	const tr = new winston.transports.Stream ({
		stream,
		format: winston.format.printf ((i => `${i.id} ${i.event === 'finish' ? i.elapsed + ' ms' : i.message}${i.details ? ' ' + JSON.stringify (i.details.params) : ''}`))
	})

	db.pool.logger.add (tr)

	await db.doAll ([
		'COMMIT',
		['COMMIT'],
	])

	await db.doAll (Readable.from ([
		['COMMIT', []],
		{sql: 'COMMIT'},
	]))

	db.pool.logger.remove (tr)

	const a = s.trim ().split ('\n').map (s => s.trim ())

	expect (a).toHaveLength (8)

	for (let i = 1; i <= 4; i ++) expect (a [2 * (i - 1)]).toBe (`1/2/db/${i} COMMIT []`)

})