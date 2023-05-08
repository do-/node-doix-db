const {DbLang, DbTable, DbView, DbModel
	, DbType 
	, DbTypeArithmetic 
	, DbTypeArithmeticFixed 
	, DbTypeArithmeticFloat 
	, DbTypeArithmeticInt 
	, DbTypeCharacter 
} = require ('..')
const Path = require ('path')
const {randomUUID} = require ('crypto')

const r = () => ['root1'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	live: false,
}

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

test ('quoteStringLiteral', () => {

	expect (lang.quoteStringLiteral ("'You don't'")).toBe ("'''You don''t'''")

})

test ('quoteLiteral', () => {

	expect (lang.quoteLiteral ("'You don't'")).toBe ("'''You don''t'''")
	expect (lang.quoteLiteral (123)).toBe ('123')
	expect (lang.quoteLiteral (123n)).toBe ('123')
	expect (lang.quoteLiteral (0===0)).toBe ('TRUE')
	expect (lang.quoteLiteral (0===1)).toBe ('FALSE')
	expect (lang.quoteLiteral (null)).toBe ('NULL')
	expect (lang.quoteLiteral ({}.id)).toBe ('NULL')
	expect (() => lang.quoteLiteral ({})).toThrow ()

})

test ('getDbObjectName', () => {

	expect (lang.getDbObjectName ({schemaName: null,    localName: 'roles'})).toBe ('"roles"')
	expect (lang.getDbObjectName ({schemaName: 'their', localName: 'roles'})).toBe ('"their"."roles"')

})

test ('genUpdateParamsSql', () => {

	jest.resetModules ()

	const m = new DbModel ({dir})
	
	m.loadModules ()
	
	const uuid = randomUUID ()
	const label = 'Default Admin'

	expect (() => lang.genUpdateParamsSql   ('users', {uuid})).toThrow ()
	expect (() => m.lang.genUpdateParamsSql ('uzerz', {uuid})).toThrow ()
	expect (() => m.lang.genUpdateParamsSql ('users', {})).toThrow ()

	expect (m.lang.genUpdateParamsSql ('users', {uuid, null: null})).toBeNull ()
	expect (m.lang.genUpdateParamsSql ('users', {uuid, label: {}.label})).toBeNull ()
	expect (m.lang.genUpdateParamsSql ('users', {uuid, label})).toStrictEqual ( [label, uuid, 'UPDATE "users" SET "label"=? WHERE "uuid"=?'])
	expect (m.lang.genUpdateParamsSql ('users', {uuid, label, id_role: null})).toStrictEqual ( [label, uuid, 'UPDATE "users" SET "label"=?,"id_role"=DEFAULT WHERE "uuid"=?'])

})

test ('genInsertParamsSql', () => {

	jest.resetModules ()

	const m = new DbModel ({dir})
	
	m.loadModules ()
	
	const uuid = randomUUID ()
	const label = 'Default Admin'

	expect (() => lang.genInsertParamsSql   ('users', {uuid})).toThrow ()
	expect (() => m.lang.genInsertParamsSql ('uzerz', {uuid})).toThrow ()

	expect (m.lang.genInsertParamsSql ('users', {label, uuid})).toStrictEqual ( [label, uuid, 'INSERT INTO "users" ("label","uuid") VALUES (?,?)'])
	expect (m.lang.genInsertParamsSql ('users', {label: {}.label, uuid})).toStrictEqual ( [uuid, 'INSERT INTO "users" ("uuid") VALUES (?)'])
	expect (m.lang.genInsertParamsSql ('users', {uuid: undefined, 1: 1})).toStrictEqual ( ['INSERT INTO "users" DEFAULT VALUES'])

})

test ('genSelectObjectParamsSql', () => {

	jest.resetModules ()

	const m = new DbModel ({dir})

	m.loadModules ()

	const uuid = randomUUID ()

	expect (lang.genSelectObjectParamsSql ('SELECT ?', 1)).toStrictEqual ( [1, 'SELECT ?'])
	expect (m.lang.genSelectObjectParamsSql ('SELECT ?', 1)).toStrictEqual ( [1, 'SELECT ?'])
	expect (m.lang.genSelectObjectParamsSql ('users_roles', [uuid, 1])).toStrictEqual ( [uuid, 1, 'SELECT * FROM "users_roles" WHERE "id_user"=? AND "id_role"=?'])

})


test ('getTypeDefinition', () => {

	expect (lang.getTypeDefinition ('bool').name).toBe ('BOOL')
	expect (lang.getTypeDefinition ('int')).toBeInstanceOf (DbTypeArithmeticInt)
	expect (lang.getTypeDefinition ('integer')).toBeInstanceOf (DbTypeArithmeticInt)
	expect (lang.getTypeDefinition ('reAl')).toBeInstanceOf (DbTypeArithmeticFloat)
	expect (lang.getTypeDefinition ('Decimal')).toBeInstanceOf (DbTypeArithmeticFixed)
	expect (lang.getTypeDefinition ('numeric')).toBeInstanceOf (DbTypeArithmeticFixed)
	expect (lang.getTypeDefinition ('CHAR')).toBeInstanceOf (DbTypeCharacter)
	expect (lang.getTypeDefinition ('varchar')).toBeInstanceOf (DbTypeCharacter)

})

