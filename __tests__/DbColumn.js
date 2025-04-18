const {DbColumn, DbReference, DbLang} = require ('..')

const newCol = src => {

	if (typeof src === 'string') src = (new DbLang ()).parseColumn (src)

	return new DbColumn (src)

}

const tst = (src, dst) => expect (newCol (src)).toEqual ({src, ...dst})

test ('Object', () => {

	const o = {name: 'id', type: 'int'}
	const od = {name: 'id', type: 'int', default: 1}
	const on = {name: 'id', type: 'int', nullable: false}
	const ond = {name: 'id', type: 'int', default: 1, nullable: true}

	expect (newCol (o)).toEqual ({...o, nullable: true})
	expect (newCol (od)).toEqual ({...od, nullable: false})
	expect (newCol (on)).toEqual (on)
	expect (newCol (ond)).toEqual (ond)
	expect (new DbReference (o)).toEqual ({...o, on: {}})

})

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

	expect (() => newCol ('text=/^/')).toThrow ()
	expect (() => newCol ('text / // ?')).toThrow ()

})

test ('range', () => {

	tst ('int [0..10]', {type: 'int', min: '0', max: '10', nullable: true})
	tst ('int [0..]', {type: 'int', min: '0', nullable: true})
	tst ('int [..10]', {type: 'int', max: '10', nullable: true})

	tst ('date = 1980-01-01 [ 1970-01-01 .. NOW  ]   /-01$/ // created ', {type: 'date', min: '1970-01-01', default: '1980-01-01', max: 'NOW', pattern: '-01$', comment: 'created', nullable: false})

	expect (() => newCol ('date ]')).toThrow ()
	expect (() => newCol ('date []')).toThrow ()

})

test ('dimension', () => {

	tst ('char(1)', {type: 'char', size: 1, nullable: true})
	tst ('decimal (10, 2)', {type: 'decimal', size: 10, scale: 2, nullable: true})

	tst (' \t \t decimal (10, 2) = 0 [ 0.00 .. 1000.00 ] /00$/ // \t\t\t salary ', {
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

	expect (() => newCol ('date )')).toThrow ()
	expect (() => newCol ('decimal (10,zz)')).toThrow ()
	expect (() => newCol ('decimal (+,1)')).toThrow ()

})

test ('nullable', () => {

	tst ('int!', {type: 'int', nullable: false})
	tst ('int?=0', {type: 'int', default: '0', nullable: true})
	
	tst (' \t \t decimal (10, 2) ?= 0 [ 0.00 .. 1000.00 ] /00$/ // \t\t\t salary ', {
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

	tst (` \t \t decimal (10, 2) ! [ 0.00 .. 1000.00 ] /00$/ {compression: '{gz}', ttl: 600} // \t\t\t salary `, {
		type: 'decimal', 
		size: 10,
		scale: 2,
		min: '0.00', 
		max: '1000.00', 
		pattern: '00$', 
		comment: 'salary',
		nullable: false,
		compression: '{gz}', 
		ttl: 600,
	})
	
	expect (() => newCol ('=0')).toThrow ()
	expect (() => newCol ('int=0}')).toThrow ()

})

const tst_ref = (src, dst) => {
	
	const col = newCol (src)

	expect (col.reference.column).toBe (col)
	
	delete col.reference.column
	delete col.reference.src

	expect (col).toEqual ({src, ...dst})
	
}


test ('reference', () => {

	tst_ref ('(users)', {type: undefined, nullable: true, reference: {targetRelationName: 'users', targetSchemaName: undefined, on: {}}})
	tst_ref ('(.users)', {type: undefined, nullable: true, reference: {targetRelationName: 'users', targetSchemaName: null, on: {}}})
	tst_ref ('(log.users)', {type: undefined, nullable: true, reference: {targetRelationName: 'users', targetSchemaName: 'log', on: {}}})
	tst_ref ('(users)!', {type: undefined, nullable: false, reference: {targetRelationName: 'users', on: {}}})
	tst_ref ('(-users)', {type: undefined, nullable: true, reference: {targetRelationName: 'users', on: {DELETE: 'CASCADE'}}})
	tst_ref ('(~users)', {type: undefined, nullable: true, reference: {targetRelationName: 'users', on: {DELETE: 'SET NULL'}}})
	tst_ref ('(~users)=current_user()', {type: undefined, nullable: false, default: 'current_user()', reference: {targetRelationName: 'users', on: {DELETE: 'SET DEFAULT'}}})
	
	expect (() => newCol ('()')).toThrow ()	
	expect (() => new DbReference ('(((')).toThrow ()
	expect (() => new DbReference (')))')).toThrow ()

})


test ('typeDim', () => {

	const lang = new DbLang ()

	{
		const col = newCol ({name: 'parent', ref: 'deps'})
		col.setLang (lang)
		expect (col.typeDim).toBeUndefined
	}

	{
		const col = newCol ({name: 'dt', type: 'date'})
		col.setLang (lang)	
		expect (col.typeDim).toBe ('DATE')	
	}

	{
		const col = newCol ({name: 'cc', type: 'char', size: 2})
		col.setLang (lang)	
		expect (col.typeDim).toBe ('CHAR(2)')
	}

	{
		const col = newCol ({name: 'amount', type: 'decimal', size: 10, scale: 2})
		col.setLang (lang)	
		expect (col.typeDim).toBe ('NUMERIC(10,2)')
	}

	{
		const col = newCol ({name: 'amount', type: 'char', size: 10, scale: undefined})
		col.setLang (lang)	
		expect (col.typeDim).toBe ('CHAR(10)')
	}

	{
		const col = newCol ({name: 'amount', type: 'bool', size: undefined, scale: undefined})
		col.setLang (lang)	
		expect (col.typeDim).toBe ('BOOL')
	}

})
