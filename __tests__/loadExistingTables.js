const MockDb = require ('./lib/MockDb.js')

test ('createMigrationPlan', async () => {
		
	const db = new MockDb ()
	
	const unknown = []

	const plan = db.createMigrationPlan ()
	
	plan.on ('unknown', t => unknown.push (t))
	
	await plan.loadExistingTables ()
	
	expect (unknown.map (i => i.name)).toStrictEqual (['__alien'])
	expect ([...plan.asIs.keys ()]).toStrictEqual (['users'])
	
})


