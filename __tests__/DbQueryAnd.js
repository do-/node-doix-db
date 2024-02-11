const {DbQueryAnd} = require ('..')

test ('bad', () => {
	
	const and = new DbQueryAnd ()

	expect (() => and.sql).toThrow ()

})

test ('basic', () => {

	const and = new DbQueryAnd ([
		{sql: 'id = ?', params: [-1]},
		{sql: 'id > ?', params: [10]},
		{sql: 'id IS NULL'},
	])
	
	expect (and.sql).toBe ('((id = ?) AND (id > ?) AND (id IS NULL))')

	expect (and.params).toStrictEqual ([-1, 10])

})
