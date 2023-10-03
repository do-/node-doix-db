const {DbModel, DbLang, DbSchemaSource, DbObjectMerger, DbTable, DbView, DbProcedure} = require ('..')
const Path = require ('path')

const src = Path.join (__dirname, 'data', 'root1')

test ('bad', () => {

	expect (() => new DbModel ({src, db: 0})).toThrow ()
	expect (() => new DbModel ({src, zzzzz: 0})).toThrow ()
	expect (() => new DbSchemaSource ({root: src, z: undefined, zzzzz: 0})).toThrow ()
	expect (() => new DbSchemaSource ({root: src, merger: 0})).toThrow ()
	expect (() => new DbModel ({src: [{name: null}, {name: null}]})).toThrow ()
	expect (() => new DbModel ({src: [{name: null, schemaName: 'public'}, {name: 'public'}]})).toThrow ()

})

test ('basic', () => {

	jest.resetModules ()

	const m = new DbModel ({src})
	
	m.loadModules ()
	
	expect ([...m.defaultSchema.map.keys ()].sort ()).toStrictEqual (['do_it', 'get_time', 'roles', 'users', 'users_roles', 'vw_roles'])
	
	const roles = m.find ('roles')
	
	expect (roles).toBeInstanceOf (DbTable)
	expect (roles.pk).toStrictEqual (['id'])
	expect (roles.data).toStrictEqual ([
        {id: 1, name: 'admin', label: 'System Administrator'},
        {id: 2, name: 'user',  label: 'Regular User'},
    ])

	expect (roles.keys.label.qName).toBe ('"roles_label"')
	expect (roles.keys.u.qName).toBe ('"r_u"')

	const users = m.find ('users')

	expect (users.columns.id_role.reference.targetRelation).toBe (roles)
	expect (users.columns.id_role.reference.targetColumn).toBe (roles.columns.id)
	expect (users.triggers.map (i => i.name)).toStrictEqual (['users__trg_0', 'trg_user_cleanup'])
				
})

test ('other type', () => {

	jest.resetModules ()

	class DD extends DbLang {
		getDbObjectClass (o) {return o.body ? DbProcedure : DbView}
	}

	const m = new DbModel ({src, foo: undefined})
	
	m.lang = new DD ()

	m.loadModules ()

	const roles = m.find ('roles')

	expect (roles).toBeInstanceOf (DbView)

	expect (roles.options).toBe ('')
	expect (roles.specification).toBe ('')
	
	roles.setLang (m.lang)
				
})

test ('extension 1', () => {

	jest.resetModules ()

	const m = new DbModel ({src})

	m.loadModules ()
	
	const roles = m.find ('roles')
	
	expect (roles.comment).toBe ('Roles')
				
})

test ('extension 2', () => {

	jest.resetModules ()

	const merger = new DbObjectMerger ()
	
	const m = new DbModel ({src: {root: src, merger}})

	m.loadModules ()

	const roles = m.find ('roles')
	
	expect (roles.comment).toBe ('Roles')
				
})

test ('broken ref: no schema', () => {

	jest.resetModules ()

	const m = new DbModel ({src, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.find ('users').columns.id_role.reference.targetSchemaName = 'rulez'
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})

test ('broken ref: no table', () => {

	jest.resetModules ()

	const m = new DbModel ({src, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.find ('users').columns.id_role.reference.targetRelationName = 'rulez'
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})

test ('broken ref: no col', () => {

	jest.resetModules ()

	const m = new DbModel ({src, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.find ('roles').pk.push ('label')
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})

test ('broken ref: no col', () => {

	jest.resetModules ()

	const m = new DbModel ({src, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()
	
	m.find ('roles').pk [0] = 'uuid'
	
	expect (() => m.resolveReferences ()).toThrow ()
				
})

test ('ref: custom col', () => {

	jest.resetModules ()

	const m = new DbModel ({src, foo: undefined})
	
	m.removeAllListeners (DbModel.EV_OBJECTS_CREATED)
	
	m.loadModules ()

	m.find ('users').columns.id_role.reference.targetColumnName = 'id'
	
	m.resolveReferences ()

	const roles = m.find ('roles')
	const users = m.find ('users')

	expect (users.columns.id_role.reference.targetRelation).toBe (roles)
	expect (users.columns.id_role.reference.targetColumn).toBe (roles.columns.id)
				
})
