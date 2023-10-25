const {DbEventLogger} = require ('..')

test ('pre 1', () => {

	const client = {
		uuid: 1,
		job: {uuid: 2},
		on: x => x
	}
	
	const l = new DbEventLogger (client)
			
	expect (l.prefix).toBe ('2/1')

})

test ('pre 2', () => {

	const client = {
		uuid: 1,
		job: {uuid: 2, parent: {uuid: 3}},
		on: x => x
	}
	
	const l = new DbEventLogger (client)
			
	expect (l.prefix).toBe ('3/2/1')

})

test ('start 1', () => {

	const client = {
		uuid: 1,
		job: {uuid: 2},
		on: x => x
	}
	
	const l = new DbEventLogger (client)
			
	expect (l.startMessage ({sql: 'SELECT 1', params: []}))
		.toStrictEqual ({level: 'info', message: '2/1 > SELECT 1'})

	expect (l.startMessage ({sql: 'SELECT ?', params: [1]}))
		.toStrictEqual ({level: 'info', message: '2/1 > SELECT ? [1]'})

})

test ('ns', () => {

	expect (DbEventLogger.normalizeSpace ('  ')).toBe ('')

	expect (DbEventLogger.normalizeSpace (`

		SELECT
			1
		FROM 
			DUAL
	
	`)).toBe ('SELECT 1 FROM DUAL')

})


test ('sp', () => {

	expect (DbEventLogger.stringifyParams ([])).toBe ('')
	expect (DbEventLogger.stringifyParams ({id: 1})).toBe ('{"id":1}')
	expect (DbEventLogger.stringifyParams (["Don't", 1, true])).toBe ("['Don''t', 1, true]")

})
