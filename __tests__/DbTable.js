const DbTable = require ('../lib/model/DbTable.js')

test ('bad', () => {

	expect (() => new DbTable ({})).toThrow ()
	expect (() => new DbTable ({name: 't'})).toThrow ()
	expect (() => new DbTable ({name: 't', columns: {}, triggers: ''})).toThrow ()
	expect (() => new DbTable ({name: 't', columns: function () {return ''}, data: function () {return ''}})).toThrow ()
})

test ('good', () => {

	const r = new DbTable ({
		name: 't',
		columns: function () {

			expect (this instanceof DbTable).toBe(true)

			expect (this.name).toBe('t')

			return { id: {type: 'int'} }
		},
		pk: 'id',
		data: function () {

			expect (this instanceof DbTable).toBe(true)

			expect (this.name).toBe('t')

			return [ {id: 1} ]
		},
		triggers: [
			{
				phase  : 'BEFORE INSERT',
				action : 'FOR EACH ROW',
				sql    : /*sql*/`
					BEGIN
						RETURN NEW;
					END;
				`,
			},
			{
				phase  : 'AFTER INSERT',
				action : 'FOR EACH ROW',
				sql    : null,
			},
		],
	})

	expect (r.columns.id.type).toBe ('int')
	expect (r.columns.id.nullable).toBe (false)

	expect (r.pk).toStrictEqual (['id'])

	expect (r.data).toStrictEqual ([{id: 1}])
})
