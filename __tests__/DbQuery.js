const {DbModel, DbQuery, DbQueryTable} = require ('..')

const Path = require ('path')

const src = Path.join (__dirname, 'data', 'root1')

test ('bad', () => {

	jest.resetModules ()
	const m = new DbModel ({src})	
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

	expect (() => {
		m.createQuery ([
			['users', {
				as: 'u1',
				filters: [
					['label', 'DISLIKE', '%'],
				]
			}],
		])
	}).toThrow ('Unknown comparison operator: DISLIKE')

	expect (() => {
		m.createQuery ([
			['users', {
				as: 'u1',
				filters: [
					['uuid', 'IS NULL'],				
					['id_role', '=', 0],
					['id_role', '>', 0],
					['id_role', '<', 0],
					['id_role', '<=', 0],
					['id_role', '>=', 0],
					['id_role', '<>', 0],
					['id_role', 'IN', 0],
				]
			}],
		])
	}).toThrow ()

})

test ('not in model', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['DUAL', {join: 'INNER'}],
		['DUAL', {as: '2'}],
		['DUAL', {as: '3', on: '2.dummy = 3.dummy'}],
		['roles'],
	])
	
	q.toQueryCount ()

})

test ('basic', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users', {
			filters: [
				['uuid', '=', null],
				['label', 'LIKE', '%'],
				['id_role', 'IN', [1, 2]],
				['id_role', 'BETWEEN', [1, 2]],
			]
		}],
		['roles', {
			as: 'r', 
			columns: ['label'],
			filters: [
				['label', 'IS NOT NULL'],
			]
		}],
	], {order: ['label', ['r.label', true]]})

	expect (q.toParamsSql ()).toStrictEqual (['%', 1, 2, 1, 2, 'SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."is_actual" AS "is_actual","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON "r"."id"="users"."id_role" AND "r"."label" IS NOT NULL WHERE "users"."label" LIKE ? AND "users"."id_role" IN (?,?) AND "users"."id_role" BETWEEN ? AND ? ORDER BY "users"."label","r"."label" DESC'])

	expect (q.toQueryCount ().toParamsSql ()).toStrictEqual (['%', 1, 2, 1, 2, 'SELECT COUNT(*) AS "cnt" FROM "users" AS "users" WHERE "users"."label" LIKE ? AND "users"."id_role" IN (?,?) AND "users"."id_role" BETWEEN ? AND ?'])

})


test ('ilike', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users', {
			filters: [
				['uuid', '=', null],
				['label', 'ILIKE', '%'],
				['id_role', 'IN', [1, 2]],
				['id_role', 'BETWEEN', [1, 2]],
			]
		}],
		['roles', {
			as: 'r', 
			columns: ['label'],
			filters: [
				['label', 'NOT ILIKE', '%'],
			]
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['%', '%', 1, 2, 1, 2, 'SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."is_actual" AS "is_actual","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON "r"."id"="users"."id_role" AND UPPER("r"."label") NOT LIKE UPPER(?) WHERE UPPER("users"."label") LIKE UPPER(?) AND "users"."id_role" IN (?,?) AND "users"."id_role" BETWEEN ? AND ?'])

	expect (q.toQueryCount ().toParamsSql ()).toStrictEqual (['%', 1, 2, 1, 2, 'SELECT COUNT(*) AS "cnt" FROM "users" AS "users" WHERE UPPER("users"."label") LIKE UPPER(?) AND "users"."id_role" IN (?,?) AND "users"."id_role" BETWEEN ? AND ?'])

})

test ('inner join', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['roles', {
			as: 'r', 
			join: 'INNER',
			columns: ['label']
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."is_actual" AS "is_actual","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" INNER JOIN "roles" AS "r" ON "r"."id"="users"."id_role"'])

	expect (q.toQueryCount ().toParamsSql ()).toStrictEqual (['SELECT COUNT(*) AS "cnt" FROM "users" AS "users" INNER JOIN "roles" AS "r" ON "r"."id"="users"."id_role"'])

})

test ('join by ref', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['roles', {
			as: 'r', 
			on: 'users.id_role', 
			columns: ['label']
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."is_actual" AS "is_actual","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON "r"."id"="users"."id_role"'])
						
})

test ('explicit join', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ([
		['users'],
		['roles', {
			as: 'r', 
			on: 'users.id_role = r.id', 
			columns: ['label']
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."is_actual" AS "is_actual","users"."id_role" AS "id_role","r"."label" AS "r.label" FROM "users" AS "users" LEFT JOIN "roles" AS "r" ON users.id_role = r.id'])
						
})


test ('ord', () => {

	jest.resetModules ()
	const m = new DbModel ({src, foo: undefined})	
	m.loadModules ()

	const q = m.createQuery ()
	const u = q.addTable ('users', {as: 'userz', columns: ['id_role', 'label']})

	q.orderBy ('id_role', true)
	q.orderBy ('label')

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "userz"."id_role" AS "id_role","userz"."label" AS "label" FROM "users" AS "userz" ORDER BY "userz"."id_role" DESC,"userz"."label"'])

})

test ('empty sets', () => {

	jest.resetModules ()
	const m = new DbModel ({
		src: {
			root: src,
			schemaName: 'public',
		}
	})	
	m.loadModules ()

	const q = m.createQuery ([
		['users', {
			filters: [
				['label', 'IN', []],
				['id_role', 'NOT IN', []],
			]
		}],
	])

	expect (q.toParamsSql ()).toStrictEqual (['SELECT "users"."uuid" AS "uuid","users"."label" AS "label","users"."is_actual" AS "is_actual","users"."id_role" AS "id_role" FROM "public"."users" AS "users" WHERE 0=1 AND 0=0'])

})
