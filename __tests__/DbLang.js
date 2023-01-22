const {DbLang, DbTable, DbView} = require ('..')

const lang = new DbLang ()

test ('getDbObjectClass', () => {

	expect (() => lang.getDbObjectClass ()).toThrow ()
	expect (() => lang.getDbObjectClass (null)).toThrow ()
	expect (() => lang.getDbObjectClass (0)).toThrow ()
	expect (() => lang.getDbObjectClass ([])).toThrow ()
	expect (() => lang.getDbObjectClass ({})).toThrow ()
	expect (lang.getDbObjectClass ({columns:{}})).toBe (DbTable)
	expect (lang.getDbObjectClass ({columns:{}, sql: ''})).toBe (DbView)

})

test ('quoteName', () => {

	expect (lang.quoteName ('users')).toBe ('"users"')

	expect (lang.quoteName ('"id"')).toBe ('"""id"""')

})

test ('getDbObjectName', () => {

	expect (lang.getDbObjectName ({schemaName: null,    localName: 'roles'})).toBe ('"roles"')
	expect (lang.getDbObjectName ({schemaName: 'their', localName: 'roles'})).toBe ('"their"."roles"')

})