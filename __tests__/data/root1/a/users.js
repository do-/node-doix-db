module.exports = {

    label: 'Users',

    columns: {
        uuid     : 'uuid    // PK',
        label    : 'string  // Human Readable Label',
        id_role  : '(roles)=2 // Role',
    },
    
    pk: 'uuid',

}