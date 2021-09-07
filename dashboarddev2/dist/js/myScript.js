$(document).ready(function() {
    $('#SnapShots_Oncetable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          { orderable: false },
          { orderable: false }
        ]
    } );

    $('#CIFS_Oncetable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          { orderable: false },
          { orderable: false }
        ]
    } );

    $('#Periods_Mintable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          { orderable: false }
        ]
    } );

    $('#SnapShots_Mintable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          { orderable: false }
        ]
    } );

    $('#Periods_Hourtable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,

          { orderable: false }
        ]
    } );

    $('#Hourlytable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          { orderable: false }
        ]
    } );
    $('#Weeklytable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          null,
          { orderable: false },
          { orderable: false }
        ]
    } );

    $('#Oncetable').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          null,
          { orderable: false },
          { orderable: false }
        ]
    } );

    $('#ReceivedSnapshots').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          { orderable: false },
          { orderable: false }
        ]
    } );

    $('#Weeklyperiods').DataTable( {
        "order": [[ 3, "desc" ]],
        'columns': [
          null,
          null,
          null,
          null,
          null,
          { orderable: false },
          { orderable: false }
        ]
    } );


});
