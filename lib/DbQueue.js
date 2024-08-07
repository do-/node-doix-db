const {Queue} = require ('doix')

class DbQueue extends Queue {

	constructor (view, o) {

        if (!('order' in o)) throw Error ('DbQueuePg: order not set for ' + view.name)

        if ('maxPending' in o && o.maxPending !== 1) throw Error (`DbQueuePg: maxPending=${o.maxPending} set for ${view.name}, must be 1`)

		super (view.model.db.app, o)

        this.view  = view
        this.order = o.order

	}

    async peek (job) {

        const {view} = this

        return job [view.model.db.name].peek (view)

    }
	
}

module.exports = DbQueue