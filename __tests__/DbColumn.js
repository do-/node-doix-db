const {DbColumn, DbReference} = require ('..')

test ('Object', () => {

	const o = {name: 'id', type: 'int'}

	expect (new DbColumn (o)).toEqual (o)
	expect (new DbReference (o)).toEqual ({...o, on: {}})

})

const tst = (src, dst) => expect (new DbColumn (src)).toEqual ({src, ...dst})

test ('comment', () => {

	tst (' int',                       {type: 'int', nullable: true})
	tst (' \t \t int //   the ID    ', {type: 'int', comment: 'the ID', nullable: true})
	tst ('int//the ID',                {type: 'int', comment: 'the ID', nullable: true})

})

test ('default', () => {

	tst ('int=0', {type: 'int', default: '0', nullable: false})
	tst ("uuid  =  current_setting('tasks.id_user')::uuid", {type: 'uuid', default: "current_setting('tasks.id_user')::uuid", nullable: false})

})

test ('pattern', () => {

	tst ('text /^[0-9]{13,15}$/', {type: 'text', pattern: '^[0-9]{13,15}$', nullable: true})
	tst ('text /^[0-9\\/]+$/',    {type: 'text', pattern: '^[0-9\\/]+$', nullable: true})
	tst ('\t  text  = OK    /^(OK|ERROR)$/    //  \t\t\t  status', {type: 'text', pattern: '^(OK|ERROR)$', default: 'OK', comment: 'status', nullable: false})

	expect (() => new DbColumn ('text=/^/')).toThrow ()
	expect (() => new DbColumn ('text / // ?')).toThrow ()

})

test ('range', () => {

	tst ('int {0..10}', {type: 'int', min: '0', max: '10', nullable: true})
	tst ('int {0..}', {type: 'int', min: '0', nullable: true})
	tst ('int {..10}', {type: 'int', max: '10', nullable: true})

	tst ('date = 1980-01-01 { 1970-01-01 .. NOW  }   /-01$/ // created ', {type: 'date', min: '1970-01-01', default: '1980-01-01', max: 'NOW', pattern: '-01$', comment: 'created', nullable: false})

	expect (() => new DbColumn ('date }')).toThrow ()
	expect (() => new DbColumn ('date {}')).toThrow ()

})

test ('dimension', () => {

	tst ('char(1)', {type: 'char', size: 1, nullable: true})
	tst ('decimal (10, 2)', {type: 'decimal', size: 10, scale: 2, nullable: true})

	tst (' \t \t decimal (10, 2) = 0 { 0.00 .. 1000.00 } /00$/ // \t\t\t salary ', {
		type: 'decimal', 
		size: 10,
		scale: 2,
		min: '0.00', 
		default: '0', 
		max: '1000.00', 
		pattern: '00$', 
		comment: 'salary',
		nullable: false,
	})

	expect (() => new DbColumn ('date )')).toThrow ()
	expect (() => new DbColumn ('decimal (10,zz)')).toThrow ()
	expect (() => new DbColumn ('decimal (+,1)')).toThrow ()

})

test ('nullable', () => {

	tst ('int!', {type: 'int', nullable: false})
	tst ('int?=0', {type: 'int', default: '0', nullable: true})
	
	tst (' \t \t decimal (10, 2) ?= 0 { 0.00 .. 1000.00 } /00$/ // \t\t\t salary ', {
		type: 'decimal', 
		size: 10,
		scale: 2,
		min: '0.00', 
		default: '0', 
		max: '1000.00', 
		pattern: '00$', 
		comment: 'salary',
		nullable: true,
	})	

	tst (' \t \t decimal (10, 2) ! { 0.00 .. 1000.00 } /00$/ // \t\t\t salary ', {
		type: 'decimal', 
		size: 10,
		scale: 2,
		min: '0.00', 
		max: '1000.00', 
		pattern: '00$', 
		comment: 'salary',
		nullable: false,
	})
	
	expect (() => new DbColumn ('=0')).toThrow ()

})

const tst_ref = (src, dst) => {
	
	const col = new DbColumn (src)

	expect (col.reference.column).toBe (col)
	
	delete col.reference.column
	delete col.reference.src

	expect (col).toEqual ({src, ...dst})
	
}


test ('reference', () => {

	tst_ref ('(users)', {type: undefined, nullable: true, reference: {relation: 'users', on: {}}})
	tst_ref ('(users)!', {type: undefined, nullable: false, reference: {relation: 'users', on: {}}})
	tst_ref ('(-users)', {type: undefined, nullable: true, reference: {relation: 'users', on: {DELETE: 'CASCADE'}}})
	tst_ref ('(~users)', {type: undefined, nullable: true, reference: {relation: 'users', on: {DELETE: 'SET NULL'}}})
	tst_ref ('(~users)=current_user()', {type: undefined, nullable: false, default: 'current_user()', reference: {relation: 'users', on: {DELETE: 'SET DEFAULT'}}})
	
	expect (() => new DbColumn ('()')).toThrow ()	
	expect (() => new DbReference ('(((')).toThrow ()
	expect (() => new DbReference (')))')).toThrow ()

})