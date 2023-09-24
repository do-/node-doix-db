module.exports = {

    comment: 'Roles',

    columns: {
        id       : 'int    // PK',
        name     : 'string // Internal Name',
        label    : 'string // Human Readable Label',
    },
    
    pk: 'id',

    data: [
        {id: 1, name: 'admin', label: 'System Administrator'},
    ],
    
    keys: {
    	botched: null,
    	label: 'label',
    	label_a: ['label'],
    	u: {
	    	localName: 'r_u',
	    	options: ['UNIQUE'],
	    	parts:   ['label'],
    	},
    },

}