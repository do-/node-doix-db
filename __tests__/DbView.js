const DbView = require ('../lib/model/DbView.js')
const DbLang = require ('../lib/DbLang.js')

test ('bad', () => {

	expect (() => new DbView ({name: 't', columns: {id: 'int'}, wrap: 0, sql: 'SELECT 1 id'})).toThrow ('wrap')

})

test ('wrap', () => {

	const lang = new DbLang ()

	{

		const v = new DbView ({name: 't', columns: {id: 'int'}, sql: 'SELECT 1 id'})

		v.setLang (lang)
		
		expect (v.sql).toBe (v.rawSql)

	}

	{

		const v = new DbView ({name: 't', columns: {id: 'int'}, sql: 'SELECT 1 id', wrap: true})
		
		v.setLang (lang)

		expect (v.sql).toBe ('SELECT "id" FROM (SELECT 1 id) t')

	}

})