const {DbModel, DbQuery, DbQueryTable, DbQueryColumn} = require ('..')

const Path = require ('path')

const r = () => ['root1'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	live: false,
}

test ('bad', () => {

	jest.resetModules ()
	const m = new DbModel ({dir})	
	m.loadModules ()

	expect (() => new DbQuery ()).toThrow ()

	const q = new DbQuery (m)
	expect (() => new DbQueryTable (0, 'userz')).toThrow ()

})

test ('basic', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = new DbQuery (m)

	const dual = new DbQueryTable (q, 'DUAL')

	const u = new DbQueryTable (q, 'users')

	expect (q.columns.get ('id_role').expr).toBe ('"users"."id_role"')
						
})

test ('ord', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = new DbQuery (m)
	const u = new DbQueryTable (q, 'users', {alias: 'userz', columns: ['label']})

	q.orderBy ('label')

	expect (q.order [0].expr).toBe ('"userz"."label"')
	expect (q.order [0].desc).toBe (false)

})
