const DbTrigger = require ('../lib/model/DbTrigger.js')
const DbModel = require ('../lib/model/DbModel.js')

test ('bad', () => {

	expect (() => new DbTrigger ({})).toThrow ()
	expect (() => new DbTrigger ({name: 't'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: 'BEFORE'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', sql: 'NULL;'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: 'BEFORE', sql: 1})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: true, sql: 'NULL;'})).toThrow ()

})

test ('not bad', () => {

//	const t = new DbTrigger ({name: 't', phase: 'BEFORE UPDATE', sql: 'NULL;', relation: {}})

	const m = new DbModel ({})

	m.defaultSchema.add ('users', {
		columns: {id: 'int'},
		pk: ['id'],
		triggers: [
			{name: 't', phase: 'BEFORE UPDATE', sql: 'NULL;'}
		]
	})

	const [t] = m.map.get ('users').triggers

	expect (t.options).toBe ('')
	expect (t.action).toBe ('')
	expect (t.schemaName).toBeNull ()

})

