const DbTable = require ('../lib/model/DbTable.js')

test ('bad', () => {

	expect (() => new DbTable ({})).toThrow ()
	expect (() => new DbTable ({name: 't'})).toThrow ()
	expect (() => new DbTable ({name: 't', columns: {}, triggers: ''})).toThrow ()

})
