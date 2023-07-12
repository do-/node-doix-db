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
	
	expect ([...m.map.keys ()].sort ()).toStrictEqual (['roles', 'users', 'users_roles', 'vw_roles'])
	
	const roles = m.map.get ('roles')
	
	expect (roles).toBeInstanceOf (DbTable)
	expect (roles.pk).toStrictEqual (['id'])
	expect (roles.data).toStrictEqual ([
        {id: 1, name: 'admin', label: 'System Administrator'},
        {id: 2, name: 'user',  label: 'Regular User'},
    ])

	const users = m.map.get ('users')

	expect (users.columns.id_role.reference.targetRelation).toBe (roles)
	expect (users.columns.id_role.reference.targetColumn).toBe (roles.columns.id)
	expect (users.triggers.map (i => i.name)).toStrictEqual (['users__trg_0', 'trg_user_cleanup'])
				
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

	expect (roles.options).toBe ('')
	expect (roles.specification).toBe ('')
	
	roles.setLang (m.lang)
				
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

test ('broken ref: no table', () => {

	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.map.get ('users').columns.id_role.reference.targetRelationName = 'rulez'
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})

test ('broken ref: no col', () => {

	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.map.get ('roles').pk.push ('label')
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})


test ('broken ref: no col', () => {

	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.map.get ('roles').pk [0] = 'uuid'
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})

test ('ref: custom col', () => {

	jest.resetModules ()

	const m = new DbModel ({dir, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()

	m.map.get ('users').columns.id_role.reference.targetColumnName = 'id'
	
	m.resolveReferences ()

	const roles = m.map.get ('roles')
	const users = m.map.get ('users')

	expect (users.columns.id_role.reference.targetRelation).toBe (roles)
	expect (users.columns.id_role.reference.targetColumn).toBe (roles.columns.id)
				
})
