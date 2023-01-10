const {DbObjectTypeDetector, DbTable, DbView} = require ('..')

const d = new DbObjectTypeDetector ()

test ('bad', () => {

	expect (() => d.getClass ()).toThrow ()
	expect (() => d.getClass (null)).toThrow ()
	expect (() => d.getClass (0)).toThrow ()
	expect (() => d.getClass ([])).toThrow ()
	expect (() => d.getClass ({})).toThrow ()

})

test ('good', () => {

	expect (d.getClass ({columns: {}})).toBe (DbTable)
	expect (d.getClass ({columns: {}, sql: ''})).toBe (DbView)

})
