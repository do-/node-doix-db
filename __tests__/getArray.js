const {DbModel} = require ('..')
const MockDb = require ('./lib/MockDb.js')
const Path = require ('path')

const src = Path.join (__dirname, 'data', 'root1')

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

	const m = new DbModel ({src, foo: undefined})

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

	expect (a [Symbol.for ('columns')]).toStrictEqual ([
		{name: 'id'}, 
		{name: 'name'}, 
		{name: 'label'} 
	])
	
})

test ('getArray query cnt', async () => {
		
	jest.resetModules ()

	const m = new DbModel ({src, foo: undefined})
	
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

