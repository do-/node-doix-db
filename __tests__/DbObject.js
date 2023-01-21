const {DbObject} = require ('..')

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

	const o = new DbObject ({name: 'their.roles'})
	
	expect (o.schemaName).toBe ('their')
	expect (o.localName).toBe ('roles')

})
