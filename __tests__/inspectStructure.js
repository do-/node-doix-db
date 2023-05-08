const {DbObject, DbTable, DbView} = require ('..')

class DbThing extends DbObject {}

const MockDb = require ('./lib/MockDb.js')

test ('error', async () => {
		
	const db = new MockDb ()

	const plan = db.createMigrationPlan ()
	
	expect (() => plan.inspectStructure ()).toThrow ()
		
})

test ('exotic', async () => {
		
	const db = new MockDb ()

	db.lang.getDbObjectClassesToDiscover = () => [DbThing, DbTable, DbView]

	const plan = db.createMigrationPlan ()
	await plan.loadStructure ()
	
	plan.asIs.set ('a', new DbThing ({name: 'a'}))
	plan.toBe.set ('a', new DbThing ({name: 'a'}))

	plan.asIs.set ('b', new DbThing ({name: 'b'}))
	plan.toBe.set ('b', new DbView ({name: 'b', sql: 'SELECT 1 id', columns: {id: 'int'}}))

	plan.asIs.set ('c', new DbView ({name: 'b', sql: 'SELECT 1 id', columns: {id: 'int'}}))
	plan.toBe.set ('c', new DbThing ({name: 'b'}))
	
	plan.inspectStructure ()
			
})

test ('main', async () => {
		
	const db = new MockDb ()

	const plan = db.createMigrationPlan ()
	
	plan.toBe.set ('v', new DbView ({name: 'v', sql: 'SELECT 1 id', columns: {id: 'int'}}))
	
	await plan.loadStructure ()

	plan.inspectStructure ()
	
	const {toDo} = plan

	expect (toDo.size).toBe (2)
	
	expect (toDo.get ('create').map (i => i.name).sort ()).toStrictEqual (['roles', 'users_roles'])
	expect (toDo.get ('recreate').map (i => i.name)).toStrictEqual (['v'])
	expect (plan.asIs.get ('users').toDo.get ('add-column').map (i => i.name).sort ()).toStrictEqual (['id_role', 'label'])
		
})
