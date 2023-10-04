const MockDb = require ('./lib/MockDb.js')

test ('createMigrationPlan', async () => {
		
	const db = new MockDb ()

	const unknown = []

	const plan = db.createMigrationPlan ()
	
	plan.on ('unknown', t => unknown.push (t))
	
	await plan.loadStructure ()
	
	expect (unknown.map (i => i.fullName).sort ()).toStrictEqual (['__alien', 'log.__alien'])
	expect ([...plan.asIs.keys ()]).toStrictEqual (['users'])
	expect (plan.toBe.has ('log.pro')).toBe (true)
})


