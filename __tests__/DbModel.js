const {DbModel, DbObjectMap, DbObjectMerger, DbTable, DbView, DbObjectTypeDetector} = require ('..')
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
	expect (() => new DbModel ({dir, detector: 0})).toThrow ()

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

	class DD extends DbObjectTypeDetector {
		getClass () {return DbView}
	}

	const m = new DbModel ({dir, detector: new DD (), foo: undefined})

	m.loadModules ()

	const roles = m.map.get ('roles')

	expect (roles).toBeInstanceOf (DbView)
				
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