const {DbSchemaSource} = require ('..')

test ('bad', () => {

	expect (() => new DbSchemaSource ({})).toThrow ()
	expect (() => new DbSchemaSource ({dir: 1, one: 1})).toThrow ()

})

test ('scalar root', () => {

	const s = new DbSchemaSource ({root: '/', filter: () => true})

	expect (s.loader.dir.dir.root).toStrictEqual (['/'])

	expect (s.loader.dir.dir.filter ()).toBe (true)

})

test ('array root', () => {

	const root = ['/1', '/2'], s = new DbSchemaSource ({root})

	expect (s.loader.dir.dir.root).toStrictEqual (root)

})