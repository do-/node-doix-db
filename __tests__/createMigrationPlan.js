const MockDb = require ('./lib/MockDb.js')

test ('createMigrationPlan', async () => {
		
	const db = new MockDb ()

	const plan = db.createMigrationPlan ()
	
	expect (plan.lang).toBe (db.lang)
	expect (plan.toBe.get ('users').columns.label.type).toBe ('STRING')

})


