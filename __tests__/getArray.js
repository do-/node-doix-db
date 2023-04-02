const {DbModel} = require ('..')
const MockDb = require ('./lib/MockDb.js')
const Path = require ('path')

const r = () => ['root1'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	live: false,
}

test ('getArray sql', async () => {
		
	const db = new MockDb ()

	const a = await db.getArray ('SELECT')

	expect (a).toStrictEqual ([
		{id: 1, name: 'admin', label: 'System Administrator'},
		{id: 2, name: 'user',  label: 'Regular User'},
	])
	
})

test ('getArray query', async () => {

	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})

	m.loadModules ()

	const db = new MockDb ()

	db.model = db.lang.model = m

	const q = m.createQuery ([['roles']])

	const a = await db.getArray (q)

	expect (a [Symbol.for ('query')]).toBe (q)
	expect (a [Symbol.for ('count')]).toBeUndefined ()

	expect (a).toStrictEqual ([
		{id: 1, name: 'admin', label: 'System Administrator'},
		{id: 2, name: 'user',  label: 'Regular User'},
	])
	
})

test ('getArray query cnt', async () => {
		
	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})
	
	m.loadModules ()
	
	const db = new MockDb ()
		
	db.model = db.lang.model = m

	const q = m.createQuery ([['roles']], {limit: 3, offset: 0})
	const a = await db.getArray (q)

	expect (a [Symbol.for ('query')]).toBe (q)
	expect (a [Symbol.for ('count')]).toBe (2)

	expect (a).toStrictEqual ([
		{id: 1, name: 'admin', label: 'System Administrator'},
		{id: 2, name: 'user',  label: 'Regular User'},
	])
	
})

