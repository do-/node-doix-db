const MockDb = require ('./lib/MockDb.js')
const {Writable} = require ('stream')
const winston = require ('winston')


test ('getObject', async () => {

	const db = new MockDb ()
	
	expect (await db.getScalar ('SELECT NULL')).toBeNull ()

	const DEF = {1: 0}

	expect (await db.getObject ('0', [], {notFound: DEF})).toBe (DEF)
	
//	const a = []; db.pool.logger.log = m => a.push (m.message)

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

	expect (await db.getObject ('roles', [1])).toStrictEqual ({id: 1, name: 'admin', label: 'System Administrator'})

	db.pool.logger.remove (tr)

	const a = s.trim ().split ('\n').map (s => s.trim ())

	expect (a).toHaveLength (2)
	expect (a [0]).toMatch (/SELECT.*FROM.*"roles".*WHERE.*"id" = \? \[1\]$/)

	db.model = undefined

	await expect (db.getObject ('0')).rejects.toThrow ()

})

