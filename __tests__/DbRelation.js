const {DbRelation} = require ('..')

test ('bad', () => {

	expect (() => new DbRelation ({})).toThrow ()
	expect (() => new DbRelation ({pk: []})).toThrow ()
	expect (() => new DbRelation ({columns: 0, pk: []})).toThrow ()
	expect (() => new DbRelation ({columns: {}, pk: ['id']})).toThrow ()

})

test ('not bad', () => {

	const r = new DbRelation ({
		columns: {
			id: {type: 'int'},
		},	
	})
	
	expect (r.pk).toStrictEqual ([])

})

test ('good', () => {

	const r = new DbRelation ({
		columns: {
			id: {type: 'int'},
			label: 'text',
		},	
		pk: 'id',
	})
	
	expect (r.columns.id.type).toBe ('int')
	expect (r.columns.id.nullable).toBe (false)

	expect (r.columns.label.type).toBe ('text')
	expect (r.columns.label.nullable).toBe (true)

	expect (r.pk).toStrictEqual (['id'])

})
