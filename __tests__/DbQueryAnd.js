const {DbQueryAnd} = require ('..')

test ('null', () => {

	expect (DbQueryAnd.from ([null, null])).toBeNull ()

})

test ('basic', () => {

	const and = DbQueryAnd.from ([
		{sql: 'id = ?', params: [-1]},
		{sql: 'id > ?', params: [10]},
		{sql: 'id IS NULL'},
	])
	
	expect (and.sql).toBe ('((id = ?) AND (id > ?) AND (id IS NULL))')

	expect (and.params).toStrictEqual ([-1, 10])

})
