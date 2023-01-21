const {DbLang} = require ('..')

const lang = new DbLang ()

test ('quoteName', () => {

	expect (lang.quoteName ('users')).toBe ('"users"')

	expect (lang.quoteName ('"id"')).toBe ('"""id"""')

})

test ('getDbObjectName', () => {

	expect (lang.getDbObjectName ({schemaName: null,    localName: 'roles'})).toBe ('"roles"')
	expect (lang.getDbObjectName ({schemaName: 'their', localName: 'roles'})).toBe ('"their"."roles"')

})