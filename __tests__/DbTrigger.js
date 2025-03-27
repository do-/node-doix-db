const DbTrigger = require ('../lib/model/DbTrigger.js')
const DbTable = require ('../lib/model/DbTable.js')
const DbModel = require ('../lib/model/DbModel.js')

test ('bad', () => {

	expect (() => new DbTrigger ({})).toThrow ()
	expect (() => new DbTrigger ({name: 't'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: 'BEFORE'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', sql: 'NULL;'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: 'BEFORE', sql: 1})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: true, sql: 'NULL;'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: true, sql: function () {return ''}})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: true, sql: null})).toThrow ()
})

test ('not bad', () => {

//	const t = new DbTrigger ({name: 't', phase: 'BEFORE UPDATE', sql: 'NULL;', relation: {}})

	const m = new DbModel ({})

	m.defaultSchema.add ('users', {
		columns: {id: 'int'},
		pk: ['id'],
		triggers: [
			{name: 't', phase: 'BEFORE UPDATE', sql: 'NULL;'},
			{name: 't', phase: 'BEFORE UPDATE', sql: 'NULL;'},
			{name: 't1', phase: 'AFTER UPDATE', sql: function () {

				expect (this instanceof DbTrigger).toBe(true)
				expect (this.table instanceof DbTable).toBe(true)
				expect (this.table.name).toBe('users')
				expect (this.table.model).toStrictEqual (m)

				return 'NULL;'
			}},
			{name: 't', phase: 'BEFORE UPDATE', sql: null},
		]
	})

	const [t] = m.find ('users').triggers

	expect (t.options).toBe ('')
	expect (t.action).toBe ('')
	expect (t.schemaName).toBeNull ()

	const [t1] = m.find ('users').triggers

	expect (t1.sql).toBe ('NULL;')

	expect (t1.table.name).toBe ('users')

	expect (t1.table.model).toStrictEqual (m)

})
