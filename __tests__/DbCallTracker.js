const EventEmitter = require ('events')
const {DbCallTracker} = require ('..')

test ('start 1', () => {

	const a = [], logger = {log: m => a.push (m)}

	const job = {tracker: {prefix: '2'}}

	const call = new EventEmitter ()
	call.ord = '3'
	call.db = {job, pool: {logger}, uuid: 1}
		
	const l = new DbCallTracker (call)

	expect (l.prefix).toBe ('2/1/3')

	call.sql = 'SELECT 1'	
	call.params = []	
	call.emit ('start')
	call.emit ('finish')

	call.sql = 'SELECT ?'	
	call.params = [1]
	call.emit ('start')
	call.emit ('finish')
	
	expect (a).toHaveLength (4)
	
	expect (a [0].message).toBe ("2/1/3 > SELECT 1")
	expect (a [1].message.slice (0, 8)).toBe ("2/1/3 < ")
	expect (a [2].message).toBe ("2/1/3 > SELECT ? [1]")
	expect (a [3].message.slice (0, 8)).toBe ("2/1/3 < ")

	for (const {level} of a ) expect (level).toBe ("info")

})

test ('sp', () => {

	expect (DbCallTracker.stringifyParams ([])).toBe ('')
	expect (DbCallTracker.stringifyParams ({id: 1})).toBe ('{"id":1}')
	expect (DbCallTracker.stringifyParams (["Don't", 1, true])).toBe ("['Don''t', 1, true]")

})
