const {DbModel, DbQuery, DbQueryTable, DbQueryColumn} = require ('..')

const Path = require ('path')

const r = () => ['root1'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	live: false,
}


test ('bad', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	expect (() => new DbQuery (0)).toThrow ()

	const q = new DbQuery (m)

	expect (() => q.check ()).toThrow ()

	const u = new DbQueryTable ()
	q.tables.push (u)
	expect (() => q.check ()).toThrow ()

	u.name = 'userz'
	expect (() => q.check ()).toThrow ()

	m.map.set ('userz', null)
	expect (() => q.check ()).toThrow ()

	u.name = 'users'
	
	const c = new DbQueryColumn ()	
	u.columns = [c]
	expect (() => q.check ()).toThrow ()

	c.expr = 'NOW()'
	expect (() => q.check ()).toThrow ()
	
	c.alias = 'ts'
	c.desc = 0
	expect (() => q.check ()).toThrow ()

	c.ord = -1
	expect (() => q.check ()).toThrow ()

	c.ord = 2
	expect (() => q.check ()).toThrow ()

	c.ord = 1
	u.columns.push (c)

	expect (() => q.check ()).toThrow ()

})

test ('basic', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = new DbQuery (m)
	expect (() => q.check ()).toThrow ()

	expect (() => q.check ()).toThrow ()

	const u = new DbQueryTable ()
	q.tables.push (u)
	expect (() => q.check ()).toThrow ()

	u.name = 'users'
	q.check ()

	expect (u.getColumn ('id_role').expr).toBe ('"users"."id_role"')
						
})

test ('ord', () => {

	jest.resetModules ()
	const m = new DbModel ({dir, foo: undefined})	
	m.loadModules ()

	const q = new DbQuery (m)
	expect (() => q.check ()).toThrow ()

	const c = new DbQueryColumn ()	
	c.expr = 'NOW()'
	c.alias = 'ts'


	const u = new DbQueryTable ()
	u.alias = 'userz'
	expect (() => u.getColumn ('id_role')).toThrow ()	
	
	u.columns = [
		m.map.get ('users').columns.label.toQueryColumn (),
		c,
	]
	u.columns [0].ord = 1
	delete u.columns [0].alias
	
	q.tables.push (u)
	expect (() => q.check ()).toThrow ()

	u.name = 'users'
	q.check ()

	expect (() => u.getColumn ('id_role')).toThrow ()
	expect (u.getColumn ('ts').qName).toBe ('"ts"')

	expect (q.order [0].expr).toBe ('"userz"."label"')
	expect (q.order [0].desc).toBe (false)
						
})
