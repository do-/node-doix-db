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

	const m = new DbModel ({src: [
		{schemaName: 'public'},
		{name: 't', schemaName: 'their'},
	]})

	m.loadModules ()

	const s = m.getSchema ('t')

	s.add ('roles', {body: 'SELECT 1'})

	const o = s.map.get ('roles')
	
	expect (o.schemaName).toBe ('their')
	expect (o.localName).toBe ('roles')

	expect (m.find ('t.roles')).toBe (o)
	expect (m.find ('tt.roles')).toBeUndefined ()
	expect (m.find ('t.rules')).toBeUndefined ()

})
