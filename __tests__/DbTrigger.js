const DbTrigger = require ('../lib/model/DbTrigger.js')

test ('bad', () => {

	expect (() => new DbTrigger ({})).toThrow ()
	expect (() => new DbTrigger ({name: 't'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: 'BEFORE'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', sql: 'NULL;'})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: 'BEFORE', sql: 1})).toThrow ()
	expect (() => new DbTrigger ({name: 't', phase: true, sql: 'NULL;'})).toThrow ()

})

test ('not bad', () => {

	const t = new DbTrigger ({name: 't', phase: 'BEFORE UPDATE', sql: 'NULL;'})
	
	expect (t.options).toBe ('')
	expect (t.action).toBe ('')

})

