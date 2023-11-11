const {Readable} = require ('stream')
const MockDb = require ('./lib/MockDb.js')
const {DbCsvPrinter, DbLang} = require ('..')
const {StringDecoder} = require ('node:string_decoder')
const DbTypeTemporal =  require ('../lib/model/types/DbTypeTemporal.js')

test ('bad', () => {

	const db = new MockDb ()
			
	expect (() => new DbCsvPrinter ()).toThrow ('columns')
	expect (() => new DbCsvPrinter ({columns: []})).toThrow ('Lang')
	expect (() => new DbCsvPrinter ({columns: ['id'], lang: new DbLang ()})).toThrow ('table')
	expect (() => new DbCsvPrinter ({columns: ['?'], table: db.model.find ('users')})).toThrow ('found')
	
})
	
test ('constructor', () => {
	
	const db = new MockDb ()

	{
		const p = db.toCsv ({
			table: db.model.find ('users'),
		})
		expect (p.columns).toHaveLength (4)
	}

	{
		const p = db.toCsv ({
			table: db.model.find ('users'),
			columns: ['uuid', 'label'],
		})
		expect (p.columns).toHaveLength (2)
	}

})

test ('print', async () => {

	const p = new DbCsvPrinter ({
		lang: new DbLang (),
		columns: {
			id: 'int',
			label: 'varchar',
			amount: 'decimal(10,2)',
			dt: 'date',
			ts: 'timestamp',
			mass: 'real',
		},
		NULL: '\\N',
	})

	const epoch = new Date (1970, 0, 1, 0, 0, 0)

	Readable.from ([
		{id: false, label: 'zero', amount: 0, dt: epoch, ts: epoch, mass: '1.23'},
		{id: true, label: 'the "one"', amount: Math.sqrt (2), dt: '1980-01-01 ', mass: 0},
		{id: 2, label: 'two'},
	]).pipe (p)

	const decoder = new StringDecoder ('utf8')

	let s = ''

	for await (b of p) s += decoder.write (b)

	s += decoder.end ()

	expect (s.split (/\n/)).toStrictEqual ([
        '0,"zero",0.00,1970-01-01,1970-01-01 00:00:00,1.23',
        '1,"the ""one""",1.41,1980-01-01,\\N,0',
        '2,"two",\\N,\\N,\\N,\\N',
        ''
	])

})

test ('infty', async () => {

	for (const id of [Infinity, -Infinity])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {id: 'int'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({id})
		})
	
	}
	catch (err) {

		expect (err.message).toMatch (/support/)
	
	}

})

test ('not int', async () => {

	for (const dt of ['?'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {dt: 'int'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({dt})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})

test ('not fixed', async () => {

	for (const dt of ['?'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {dt: 'decimal (10, 2)'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({dt})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})

test ('not float', async () => {

	for (const dt of ['?'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {dt: 'real'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({dt})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})


test ('not date', async () => {

	for (const dt of [Symbol (), '?'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {dt: 'date'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({dt})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})

test ('not ts', async () => {

	for (const dt of [Symbol (), '?'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {dt: 'timestamp'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({dt})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})

test ('unknown type', async () => {

	for (const q of ['?'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {q: 'json'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({q})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})

test ('unknown temporal', async () => {

	for (const q of ['1970-01-01'])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {q: 'date'},
		})

		p.columns [0].typeDef = new DbTypeTemporal ()

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({q})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})

test ('nullable', async () => {

	for (const q of [null, undefined])  try {

		const p = new DbCsvPrinter ({
			lang: new DbLang (),
			columns: {q: 'char!'},
		})

		await new Promise ((ok, fail) => {
			p.on ('error', fail)
			p.on ('finish', ok)
			p.write ({q})
		})
	
	}
	catch (err) {

		expect (err.message).toBeDefined ()
	
	}

})


test ('not ts', async () => {

	const p = new DbCsvPrinter ({
		lang: new DbLang (),
		columns: {dt: 'timestamp'},
	})

	p.columns [0].scale = 2

	Readable.from ([
		{dt: '1970-01-01 12:34:56.789'},
	]).pipe (p)

	const decoder = new StringDecoder ('utf8')

	let s = ''

	for await (b of p) s += decoder.write (b)

	s += decoder.end ()

	expect (s.trim ()).toBe ('1970-01-01 12:34:56.78')

})
