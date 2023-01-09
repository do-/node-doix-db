const {DbObjectMerger} = require ('..')

const t1 = () => ({
	name: 'users',
	columns: {
		id: {TYPE: 'int'},
	},	
})

const t2 = () => ({
	name: 'users',
	columns: {
		id: {AUTO_INCREMENT: true},
		label: {TYPE: 'text'},
	},
})

const tm = () => ({
	name: 'users',
	columns: {
		id: {TYPE: 'int', AUTO_INCREMENT: true},
		label: {TYPE: 'text'},
	},
})

test ('1', () => {

	const om = new DbObjectMerger ()

	expect (om.merge ({...t1 (), pk: 'id'}, {...t2 ()})).toStrictEqual ({...tm (), pk: 'id'})
	expect (om.merge ({...t1 ()}, {...t2 (), pk: 'id'})).toStrictEqual ({...tm (), pk: 'id'})
	expect (om.merge ({...t1 (), pk: 'id'}, {...t2 (), pk: 'id'})).toStrictEqual ({...tm (), pk: 'id'})
	expect (om.merge ({...t1 (), pk: ['id']}, {...t2 (), pk: 'id'})).toStrictEqual ({...tm (), pk: ['id']})
	expect (om.merge ({...t1 (), pk: 'id'}, {...t2 (), pk: ['id']})).toStrictEqual ({...tm (), pk: ['id']})
	expect (om.merge ({...t1 (), pk: ['id']}, {...t2 (), pk: ['id']})).toStrictEqual ({...tm (), pk: ['id']})

	expect (() => om.merge ({...t1 (), pk: 'id'}, {...t2 (), pk: 'label'})).toThrow ()
	expect (() => om.merge ({...t1 (), pk: ['id']}, {...t2 (), pk: 'label'})).toThrow ()
	expect (() => om.merge ({...t1 (), pk: 'id'}, {...t2 (), pk: ['label']})).toThrow ()
	expect (() => om.merge ({...t1 (), pk: ['id']}, {...t2 (), pk: ['label']})).toThrow ()

})
