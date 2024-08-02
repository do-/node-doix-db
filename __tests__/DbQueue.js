const EventEmitter = require ('events')
const {Application} = require ('doix')
const DbQueue = require ('../lib/DbQueue.js')
const DbClient = require ('../lib/DbClient.js')
const DbModel = require ('../lib/model/DbModel.js')

const app = new Application ({
	modules: {dir: {root: __dirname}}
})

test ('bad', () => {

	expect (() => new DbQueue ({}, {})).toThrow ('order')
	expect (() => new DbQueue ({}, {order: 'id', maxPending: 10})).toThrow ('ending')

})

test ('not bad', async () => {

	const db = new DbClient ()
	db.name = 'db'
	db.app = app

	const m = new DbModel ({})
	m.db = db
	db.lang = m.lang

	m.defaultSchema.add ('users', {
		columns: {id: 'int'},
		pk: ['id'],
	})

	m.defaultSchema.add ('q_users', {
		columns: {id: 'int'},
		pk: ['id'],
		sql: 'SELECT * FROM users',
		queue: {
			order: 'id',
		},
	})

	const {queue} = m.find ('q_users')

	expect (queue).toBeInstanceOf (DbQueue)

	expect (queue.maxPending).toBe (1)

	const job = new EventEmitter ()
	job.db = db
	job.tracker = {}
	db.job = job

	const a = []

	db.getObject = async sql => a.push (sql)

	await queue.peek (job)

	expect (a).toStrictEqual (['SELECT * FROM "q_users" ORDER BY id'])

})

