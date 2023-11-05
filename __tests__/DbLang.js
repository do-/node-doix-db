const {DbLang, DbTable, DbView, DbModel, DbColumn
	, DbTypeArithmeticFixed 
	, DbTypeArithmeticFloat 
	, DbTypeArithmeticInt 
	, DbTypeCharacter 
	, DbTypeDate
	, DbTypeTimestamp
} = require ('..')
const Path = require ('path')
const {randomUUID} = require ('crypto')

const src = Path.join (__dirname, 'data', 'root1')

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

	const m = new DbModel ({src})
	
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

	const m = new DbModel ({src})
	
	m.loadModules ()
	
	const uuid = randomUUID ()
	const label = 'Default Admin'

	expect (() => lang.genInsertParamsSql   ('users', {uuid})).toThrow ()
	expect (() => m.lang.genInsertParamsSql ('uzerz', {uuid})).toThrow ()

	expect (m.lang.genInsertParamsSql ('users', {label, uuid})).toStrictEqual ( [label, uuid, 'INSERT INTO "users" ("label","uuid") VALUES (?,?)'])
	expect (m.lang.genInsertParamsSql ('users', {label: {}.label, uuid})).toStrictEqual ( [uuid, 'INSERT INTO "users" ("uuid") VALUES (?)'])
	expect (m.lang.genInsertParamsSql ('users', {uuid: undefined, 1: 1})).toStrictEqual ( ['INSERT INTO "users" DEFAULT VALUES'])

})

test ('getTypeDefinition', () => {

	expect (lang.getTypeDefinition ('bool').name).toBe ('BOOL')
	expect (lang.getTypeDefinition ('reAl')).toBeInstanceOf (DbTypeArithmeticFloat)
	expect (lang.getTypeDefinition ('Decimal')).toBeInstanceOf (DbTypeArithmeticFixed)
	expect (lang.getTypeDefinition ('numeric')).toBeInstanceOf (DbTypeArithmeticFixed)
	expect (lang.getTypeDefinition ('CHAR')).toBeInstanceOf (DbTypeCharacter)
	expect (lang.getTypeDefinition ('varchar')).toBeInstanceOf (DbTypeCharacter)
	expect (lang.getTypeDefinition ('Date')).toBeInstanceOf (DbTypeDate)
	expect (lang.getTypeDefinition ('timestamp')).toBeInstanceOf (DbTypeTimestamp)

})


test ('isAdequateColumnType', () => {

	expect (	
		lang.isAdequateColumnType (
			lang.getTypeDefinition ('bigint'),
			lang.getTypeDefinition ('integer')
		)	
	).toBe (true)

	expect (	
		lang.isAdequateColumnType (
			lang.getTypeDefinition ('int'),
			lang.getTypeDefinition ('smallint')
		)	
	).toBe (true)

	expect (	
		lang.isAdequateColumnType (
			lang.getTypeDefinition ('int'),
			lang.getTypeDefinition ('bool')
		)	
	).toBe (false)

	expect (	
		lang.isAdequateColumnType (
			lang.getTypeDefinition ('int'),
			new DbTypeArithmeticInt ({name: 'UINT32', bytes: 4, isSigned: false})
		)	
	).toBe (false)

	expect (	
		lang.isAdequateColumnType (
			lang.getTypeDefinition ('string'),
			lang.getTypeDefinition ('string')
		)	
	).toBe (true)

})

test ('isAdequateColumnTypeDim', () => {

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('int'),
			new DbColumn ('int')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('int'),
			new DbColumn ('smallint=0')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('varchar(255)'),
			new DbColumn ('varchar(10)')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('char(5)'),
			new DbColumn ('char(10)')
		)
	).toBe (false)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('decimal(10, 3)'),
			new DbColumn ('numeric(5, 2)')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('decimal(5, 3)'),
			new DbColumn ('numeric(10, 3)')
		)
	).toBe (false)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('decimal(10, 2)'),
			new DbColumn ('numeric(5, 3)')
		)
	).toBe (false)

})

test ('isAdequateColumnTypeDim', () => {

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('int'),
			new DbColumn ('int')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('int'),
			new DbColumn ('smallint=0')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('varchar(255)'),
			new DbColumn ('varchar(10)')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('char(5)'),
			new DbColumn ('char(10)')
		)
	).toBe (false)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('decimal(10, 3)'),
			new DbColumn ('numeric(5, 2)')
		)
	).toBe (true)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('decimal(5, 3)'),
			new DbColumn ('numeric(10, 3)')
		)
	).toBe (false)

	expect (	
		lang.isAdequateColumnTypeDim (
			new DbColumn ('decimal(10, 2)'),
			new DbColumn ('numeric(5, 3)')
		)
	).toBe (false)

})

test ('genColumnDefault', () => {

	expect (	
		lang.genColumnDefault (
			new DbColumn ('int=1')
		)
	).toBe ("'1'")

	expect (	
		lang.genColumnDefault (
			{default: 'NULL'}
		)
	).toBe ("NULL")

})

test ('genColumnDefinition', () => {
	
	const column = new DbColumn ('int=1')
	column.name = 'id'
	column.setLang (lang)

	expect (lang.genColumnDefinition (column)).toBe (`"id" INT DEFAULT '1' NOT NULL`)

	column.nullable = true

	expect (lang.genColumnDefinition (column)).toBe (`"id" INT DEFAULT '1'`)

	delete column.default

	expect (lang.genColumnDefinition (column)).toBe (`"id" INT`)

})

test ('compareColumns', () => {

	expect (	
		lang.compareColumns (
			new DbColumn ('int'),
			new DbColumn ('int')
		)
	).toStrictEqual ([])

	expect (	
		lang.compareColumns (
			new DbColumn ('int'),
			new DbColumn ('int!')
		)
	).toStrictEqual (['nullable'])

	expect (	
		lang.compareColumns (
			new DbColumn ('int!'),
			new DbColumn ('int=0')
		)
	).toStrictEqual (['default'])

	expect (	
		lang.compareColumns (
			new DbColumn ('bigint'),
			new DbColumn ('int')
		)
	).toStrictEqual ([])

	expect (	
		lang.compareColumns (
			new DbColumn ('int'),
			new DbColumn ('bigint')
		)
	).toStrictEqual (['typeDim'])

	expect (	
		lang.compareColumns (
			new DbColumn ('numeric(5,2)'),
			new DbColumn ('numeric(10,2)')
		)
	).toStrictEqual (['typeDim'])

})

test ('getTriggerName', () => {

	expect (	
		lang.getTriggerName (
			{name: 'my_table', triggers: [{}]}, 0
		)
	).toBe ('my_table__trg_0')

	expect (	
		lang.getTriggerName (
			{name: 'my_table', triggers: new Array (100)}, 7
		)
	).toBe ('my_table__trg_07')

})

