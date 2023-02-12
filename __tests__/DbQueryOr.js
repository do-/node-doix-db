const {DbQueryOr} = require ('..')

test ('bad', () => {
	
	const or = new DbQueryOr ()

	expect (() => or.sql).toThrow ()

})

test ('basic', () => {

	const or = new DbQueryOr ([
		{sql: 'id = ?', params: [-1]},
		{sql: 'id > ?', params: [10]},
		{sql: 'id IS NULL'},
	])
	
	expect (or.sql).toBe ('id = ? OR id > ? OR id IS NULL')

	expect (or.params).toStrictEqual ([-1, 10])

})
