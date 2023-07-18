const {DbLang} = require ('..')
const DbRoutineParameter = require ('../lib/model/DbRoutineParameter.js')

test ('Object', () => {

	expect (() => new DbRoutineParameter ({name: 'id'})).toThrow ()
	expect (() => new DbRoutineParameter ({type: 'int'})).toThrow ()

	expect (new DbRoutineParameter ({name: 'id', type: 'int'})).toEqual ({name: 'id', type: 'int', mode: 'IN'})
	expect (new DbRoutineParameter ({name: 'id', type: 'int', mode: 'OUT'})).toEqual ({name: 'id', type: 'int', mode: 'OUT'})

})

test ('Scalar', () => {

	expect (() => new DbRoutineParameter (0)).toThrow ()
	expect (() => new DbRoutineParameter ('')).toThrow ()
	expect (() => new DbRoutineParameter ('=')).toThrow ()

	expect (new DbRoutineParameter ('id int')).toEqual ({name: 'id', type: 'int', mode: 'IN'})
	expect (new DbRoutineParameter ('OUT id int')).toEqual ({name: 'id', type: 'int', mode: 'OUT'})
	expect (new DbRoutineParameter ('INOUT id int')).toEqual ({name: 'id', type: 'int', mode: 'INOUT'})
	expect (new DbRoutineParameter ('id int = 0')).toEqual ({name: 'id', type: 'int', mode: 'IN', default: '0'})
	expect (new DbRoutineParameter ("INOUT xtra text = 'txt'")).toEqual ({name: 'xtra', type: 'text', mode: 'INOUT', default: "'txt'"})

})


test ('lang', () => {

	const param = new DbRoutineParameter ('i"d int')
	
	param.setLang (new DbLang ())

	expect (param).toEqual ({name: 'i"d', qName: '"i""d"', type: 'int', mode: 'IN'})

})

