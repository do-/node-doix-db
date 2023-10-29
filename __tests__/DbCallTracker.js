const EventEmitter = require ('events')
const {DbCallTracker} = require ('..')

test ('pre 1', () => {

	const client = {
		uuid: 1,
		job: {uuid: 2},
		on: x => x
	}
	
	const l = new DbCallTracker (client)
			
	expect (l.prefix).toBe ('2/1')

})

test ('pre 2', () => {

	const client = {
		uuid: 1,
		job: {uuid: 2, parent: {uuid: 3}},
		on: x => x
	}
	
	const l = new DbCallTracker (client)
			
	expect (l.prefix).toBe ('3/2/1')

})

test ('start 1', () => {

	const a = [], logger = {log: m => a.push (m)}

	const job = {uuid: '2'}

	const client = new EventEmitter ()
	client.uuid = '1'
	client.job = job
	client.logger = logger
		
	const l = new DbCallTracker (client)

	client.emit ('start', {sql: 'SELECT 1', params: []})
	client.emit ('finish')

	client.emit ('start', {sql: 'SELECT ?', params: [1]})
	client.emit ('finish')

	expect (a).toHaveLength (4)
	
	expect (a [0].message).toBe ("2/1 > SELECT 1")
	expect (a [1].message.slice (0, 6)).toBe ("2/1 < ")
	expect (a [2].message).toBe ("2/1 > SELECT ? [1]")
	expect (a [3].message.slice (0, 6)).toBe ("2/1 < ")

	for (const {level} of a ) expect (level).toBe ("info")

})

test ('sp', () => {

	expect (DbCallTracker.stringifyParams ([])).toBe ('')
	expect (DbCallTracker.stringifyParams ({id: 1})).toBe ('{"id":1}')
	expect (DbCallTracker.stringifyParams (["Don't", 1, true])).toBe ("['Don''t', 1, true]")

})
