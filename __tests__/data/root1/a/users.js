module.exports = {

    comment: 'Users',

    columns: {
        uuid     : 'uuid    // PK',
        label    : 'string!  // Human Readable Label',
        is_actual: 'boolean!  // Is actual',        
        id_role  : '(roles)=2 // Role',

        old_slack: null,
        long_gone: null,

    },
    
    pk: 'uuid',
    
    triggers: [

	   	{
			phase  : 'BEFORE INSERT OR UPDATE',
			action : 'FOR EACH ROW',
			sql    : `NULL;`,
    	},
	   	{
	   		name   : 'trg_user_cleanup',
			phase  : 'AFTER DELETE',
			sql    : `NULL;`,
    	},

    ],    

}