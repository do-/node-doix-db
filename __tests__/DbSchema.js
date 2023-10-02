const {DbSchema, DbLang, DbTable} = require ('..')

test ('bad', () => {

	expect (() => new DbSchema ({one: 1})).toThrow ()

})

test ('basic', () => {

	const lang = new DbLang (), model = {lang}

	const s = new DbSchema ({model})

	const NAME = 'users', OPTIONS = {columns: {id: 'int'}, pk: ['id']}

	s.add (NAME, OPTIONS)

	expect (s.map.get ('users')).toBeInstanceOf (DbTable)

	expect (() => s.add (NAME, OPTIONS)).toThrow ()

})