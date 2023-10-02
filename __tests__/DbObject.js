const {DbObject, DbModel} = require ('..')

test ('bad', () => {

	expect (() => new DbObject ({})).toThrow ()
	expect (() => new DbObject ({name: ''})).toThrow ()
	expect (() => new DbObject ({name: 1})).toThrow ()

})

test ('names local', () => {

	const o = new DbObject ({name: 'roles'})
	
	expect (o.schemaName).toBeNull ()
	expect (o.localName).toBe ('roles')

})

test ('names foreign', () => {

	const m = new DbModel ({schemata: [['t', 'their'], [null, 'public'], 'log']})
	m.loadModules ()

	const s = m.getSchema ('t')

	s.add ('roles', {body: 'SELECT 1'})

	const o = s.map.get ('roles')
	
	expect (o.schemaName).toBe ('their')
	expect (o.localName).toBe ('roles')

})
