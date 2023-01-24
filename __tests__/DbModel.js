const {DbModel, DbLang, DbObjectMap, DbObjectMerger, DbTable, DbView} = require ('..')
const Path = require ('path')

const r = () => ['root1'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	live: false,
}

test ('bad', () => {

	expect (() => new DbModel ({dir, db: 0})).toThrow ()
	expect (() => new DbModel ({dir, zzzzz: 0})).toThrow ()
	expect (() => new DbObjectMap ({dir, z: undefined, zzzzz: 0})).toThrow ()
	expect (() => new DbObjectMap ({dir, merger: 0})).toThrow ()

})

test ('basic', () => {

	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})
	
	m.loadModules ()
	
	expect ([...m.map.keys ()]).toStrictEqual (['roles'])
	
	const roles = m.map.get ('roles')
	
	expect (roles).toBeInstanceOf (DbTable)
	expect (roles.pk).toStrictEqual (['id'])
	expect (roles.data).toStrictEqual ([
        {id: 1, name: 'admin', label: 'System Administrator'},
        {id: 2, name: 'user',  label: 'Regular User'},
    ])
				
})

test ('other type', () => {

	jest.resetModules ()

	class DD extends DbLang {
		getDbObjectClass () {return DbView}
	}

	const m = new DbModel ({dir, foo: undefined})
	
	m.lang = new DD ()

	m.loadModules ()

	const roles = m.map.get ('roles')

	expect (roles).toBeInstanceOf (DbView)
	
	roles.setLang (m.lang)
	
	expect (m.lang.genCreateMockView (roles)).toBe ('CREATE VIEW "roles" AS SELECT CAST (NULL AS INT) AS "id",CAST (NULL AS STRING) AS "name",CAST (NULL AS STRING) AS "label"')
				
})

test ('extension 1', () => {

	jest.resetModules ()

	const m = new DbModel ({dir})
	
	m.map.merger.on ('complete', o => {o.comment = o.label; delete o.label})

	m.loadModules ()
	
	const roles = m.map.get ('roles')
	
	expect (roles.comment).toBe ('Roles')
				
})

test ('extension 2', () => {

	jest.resetModules ()

	const merger = new DbObjectMerger ()
	
	merger.on ('complete', o => {o.comment = o.label; delete o.label})

	const m = new DbModel ({dir, merger})

	m.loadModules ()

	const roles = m.map.get ('roles')
	
	expect (roles.comment).toBe ('Roles')
				
})