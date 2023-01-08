const {DbColumn} = require ('..')

test ('Object', () => {

	const o = {name: 'id', type: 'int'}

	expect (new DbColumn (o)).toEqual (o)

})

const tst = (src, dst) => expect (new DbColumn (src)).toEqual ({src, ...dst})

test ('comment', () => {

	tst (' int', {type: 'int'})
	tst (' \t \t int //   the ID    ', {type: 'int', comment: 'the ID'})
	tst ('int//the ID',                {type: 'int', comment: 'the ID'})

})

test ('default', () => {

	tst ('int=0', {type: 'int', default: '0'})
	tst ("uuid  =  current_setting('tasks.id_user')::uuid", {type: 'uuid', default: "current_setting('tasks.id_user')::uuid"})

})

test ('pattern', () => {

	tst ('text /^[0-9]{13,15}$/', {type: 'text', pattern: '^[0-9]{13,15}$'})
	tst ('text /^[0-9\\/]+$/',    {type: 'text', pattern: '^[0-9\\/]+$'})
	tst ('\t  text  = OK    /^(OK|ERROR)$/    //  \t\t\t  status', {type: 'text', pattern: '^(OK|ERROR)$', default: 'OK', comment: 'status'})

	expect (() => new DbColumn ('text=/^/')).toThrow ()
	expect (() => new DbColumn ('text / // ?')).toThrow ()

})

test ('range', () => {

	tst ('int {0..10}', {type: 'int', min: '0', max: '10'})
	tst ('int {0..}', {type: 'int', min: '0'})
	tst ('int {..10}', {type: 'int', max: '10'})

	tst ('date = 1980-01-01 { 1970-01-01 .. NOW  }   /-01$/ // created ', {type: 'date', min: '1970-01-01', default: '1980-01-01', max: 'NOW', pattern: '-01$', comment: 'created'})

	expect (() => new DbColumn ('date }')).toThrow ()
	expect (() => new DbColumn ('date {}')).toThrow ()

})

test ('dimension', () => {

	tst ('char(1)', {type: 'char', size: 1})
	tst ('decimal (10, 2)', {type: 'decimal', size: 10, scale: 2})

	tst (' \t \t decimal (10, 2) = 0 { 0.00 .. 1000.00 } /00$/ // \t\t\t salary ', {
		type: 'decimal', 
		size: 10,
		scale: 2,
		min: '0.00', 
		default: '0', 
		max: '1000.00', 
		pattern: '00$', 
		comment: 'salary'
	})

	expect (() => new DbColumn ('date )')).toThrow ()
	expect (() => new DbColumn ('decimal (10,zz)')).toThrow ()
	expect (() => new DbColumn ('decimal (+,1)')).toThrow ()

})