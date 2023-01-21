const {DbLang} = require ('..')

const lang = new DbLang ()

test ('quoteName', () => {

	expect (lang.quoteName ('users')).toBe ('"users"')

	expect (lang.quoteName ('"id"')).toBe ('"""id"""')

})

test ('splitName local', () => {

	const o = {name: 'roles'}
	
	lang.splitName (o)

	expect (o.localName).toBe ('roles')
	expect (o.schemaName).toBeNull ()

})

test ('splitName foreign', () => {

	const o = {name: 'their.roles'}
	
	lang.splitName (o)

	expect (o.localName).toBe ('roles')
	expect (o.schemaName).toBe ('their')

})