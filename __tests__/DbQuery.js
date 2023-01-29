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

	expect (() => {
		m.createQuery ([
			['users', {
				join: 'CROSS'
			}],
			['roles', {
				as: 'r', 
				columns: ['label']
			}],
		])
	}).toThrow ()

	expect (() => {
		m.createQuery ([
			['users', {
			}],
			['roles', {
				join: 'RIGHT',
				as: 'r', 
				columns: ['label']
			}],
		])
	}).toThrow ()

	expect (() => {
		m.createQuery ([
			['users', {
			}],
			['roles', {
				join: 'CROSS',
				on: 'users.id_role',
				as: 'r', 
				columns: ['label']
			}],
		])
	}).toThrow ()

	expect (() => {
		m.createQuery ([
			['users', {
				as: 'u1',
			}],
			['users', {
				as: 'u2',
			}],
		])
	}).toThrow ()

	expect (() => {
		m.createQuery ([
			['users', {
				as: 'u1',
			}],
			['users', {
				as: 'u2',
				on: 'u1.uuid=u2.uuid'
			}],
			['roles'],
		])
	}).toThrow ()


})

test ('not in model', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['DUAL'],
		['DUAL', {as: '2'}],
		['DUAL', {as: '3', on: '2.dummy = 3.dummy'}],
		['roles'],
	])

})

test ('basic', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['roles', {
			as: 'r', 
			columns: ['label']
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON "r"."id"="users"."id_role"'])
						
})

test ('join by ref', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['roles', {
			as: 'r', 
			on: 'users.id_role', 
			columns: ['label']
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON "r"."id"="users"."id_role"'])
						
})

test ('explicit join', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['roles', {
			as: 'r', 
			on: 'users.id_role = r.id', 
			columns: ['label']
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON users.id_role = r.id'])
						
})


test ('ord', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ()
	const u = q.addTable ('users', {as: 'userz', columns: ['id_role', 'label']})

	q.orderBy ('id_role', true)
	q.orderBy ('label')

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "userz"."id_role" AS "id_role","userz"."label" AS "label" FROM "users" AS "userz" ORDER BY "userz"."id_role" DESC,"userz"."label"'])

})