const {DbQueryNot} = require ('..')

test ('basic', () => {

	const not = new DbQueryNot (
		{sql: 'id = ?', params: [-1]},
	)
	
	expect (not.sql).toBe ('NOT (id = ?)')

	expect (not.params).toStrictEqual ([-1])

})
