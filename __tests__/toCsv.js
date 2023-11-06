const {DbLang, DbColumn} = require ('..')

const lang = new DbLang ()

test ('null', () => {

	expect (() => lang.toCsv (null, new DbColumn ({name: 's', nullable: false, type: 'varchar'}))).toThrow ()
	expect (lang.toCsv (null, new DbColumn ({name: 's', type: 'varchar'}))).toBe ('')
	expect (lang.toCsv (null, new DbColumn ({name: 's', type: 'varchar', default: '1'}))).toBe ('"1"')

})

test ('text', () => {

	expect (lang.toCsv ('the "one"', new DbColumn ({name: 's', type: 'varchar'}))).toBe ('"the ""one"""')

})

test ('bool', () => {

	expect (lang.toCsv (false, new DbColumn ({name: 's', type: 'bool'}))).toBe ('0')
	expect (lang.toCsv (true, new DbColumn ({name: 's', type: 'bool'}))).toBe ('1')

})

test ('number', () => {

	expect (lang.toCsv (123, new DbColumn ({name: 's', type: 'int'}))).toBe ('123')
	expect (lang.toCsv (Math.sqrt (2), new DbColumn ({name: 's', type: 'decimal', scale: 1}))).toBe ('1.4')
	expect (lang.toCsv (Infinity, new DbColumn ({name: 's', type: 'int'}))).toBe ('')
	expect (lang.toCsv (-Infinity, new DbColumn ({name: 's', type: 'int'}))).toBe ('')
	expect (() => lang.toCsv ({}, new DbColumn ({name: 's', type: 'int'}))).toThrow ()

})

test ('date', () => {

	expect (lang.toCsv (new Date (), new DbColumn ({name: 's', type: 'date'}))).toMatch (/^\d{4}-\d{2}-\d{2}$/)
	expect (lang.toCsv (new Date ().toJSON (), new DbColumn ({name: 's', type: 'date'}))).toMatch (/^\d{4}-\d{2}-\d{2}$/)
	expect (() => lang.toCsv ('xxx', new DbColumn ({name: 's', type: 'date'}))).toThrow ()
	expect (() => lang.toCsv (true, new DbColumn ({name: 's', type: 'date'}))).toThrow ()

})

test ('ts', () => {

	const col = new DbColumn ({name: 's', type: 'timestamp'})

	expect (lang.toCsv (new Date (), col)).toMatch (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
	expect (lang.toCsv (new Date (), col)).toMatch (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)

	expect (lang.toCsv (new Date (), new DbColumn ({name: 's', type: 'timestamp', scale: 1}))).toMatch (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d$/)

	expect (() => lang.toCsv ('xxx', col)).toThrow ()
	expect (() => lang.toCsv (true, col)).toThrow ()

})

test ('unknown', () => {

	expect (() => lang.toCsv (Symbol ('STAR'), new DbColumn ({name: 's', type: 'text'}))).toThrow ()

})