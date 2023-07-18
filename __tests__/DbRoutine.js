const {DbLang} = require ('..')
const DbRoutine = require ('../lib/model/DbRoutine.js')

test ('bad', () => {

	expect (() => new DbRoutine ({})).toThrow ()

	new DbRoutine ({name: 'name', body: '0', parameters: ['id int']})

	expect (() => new DbRoutine ({body: '0', parameters: true})).toThrow ()

})

test ('not bad', () => {

	const r = new DbRoutine ({name: 'name', body: '0', parameters: ['id int']})
	
	r.setLang (new DbLang ())

})