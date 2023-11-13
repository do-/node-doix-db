const MockDb = require ('./lib/MockDb.js')
const {Readable, Writable} = require ('stream')

const DATA = [
	{id: 1, label: 'admin'},
	{id: 2, label: 'role', is_actual: false},
]

test ('explicit columns', async () => {

	const db = new MockDb ()

	const a = []

	db.putObjectStream = (name, columns, o) => {

		return new Writable ({objectMode: true,

			write (chunk, encoding, callback) {

				a.push (Object.fromEntries (Object.entries (chunk).filter (i => columns.includes (i[0]))))

				callback ()

			},

			destroy () {

				this.emit ('complete')

			}

		})

	}

	await db.insert ('roles', DATA, {columns: ['id', 'is_actual']})

	expect (a).toStrictEqual ([
		{id: 1},
		{id: 2, is_actual: false},	
	])
	
})

test ('auto columns', async () => {

	const db = new MockDb ()

	const a = []

	db.putObjectStream = (name, columns, o) => {

		return new Writable ({objectMode: true,

			write (chunk, encoding, callback) {

				a.push (Object.fromEntries (Object.entries (chunk).filter (i => columns.includes (i[0]))))

				callback ()

			},

			destroy () {

				this.emit ('complete')

			}

		})

	}

	await db.insertArray ('roles', DATA, {rows: 0})

	expect (a).toStrictEqual ([
		{id: 1, label: 'admin'},
		{id: 2, label: 'role'},	
	])
	
})

test ('empty', async () => {

	const db = new MockDb ()

	const a = []

	db.putObjectStream = (name, columns, o) => {

		return new Writable ({objectMode: true,

			write (chunk, encoding, callback) {

				a.push (Object.fromEntries (Object.entries (chunk).filter (i => columns.includes (i[0]))))

				callback ()

			},

			destroy () {

				this.emit ('complete')

			}

		})

	}

	await db.insert ('roles', Readable.from ([]), {})

	expect (a).toHaveLength (0)
	
})