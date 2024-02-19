const {DbQueryNot} = require ('..')

test ('null', () => {

	expect (DbQueryNot.from (null)).toBeNull ()

})

test ('basic', () => {

	const not = DbQueryNot.from (
		{sql: 'id = ?', params: [-1]},
	)
	
	expect (not.sql).toBe ('NOT (id = ?)')

	expect (not.params).toStrictEqual ([-1])

})
