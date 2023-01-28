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

test ('not in model', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ()
	const dual = new DbQueryTable (q, 'DUAL')
	
})

test ('basic', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ()
	const u = q.addTable ('users')

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."id_role" AS "id_role" FROM "users" AS "users"'])
						
})

test ('ord', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ()
	const u = q.addTable ('users', {alias: 'userz', columns: ['id_role', 'label']})

	q.orderBy ('id_role', true)
	q.orderBy ('label')

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "userz"."id_role" AS "id_role","userz"."label" AS "label" FROM "users" AS "userz" ORDER BY "userz"."id_role" DESC,"userz"."label"'])

})
