"use strict"
$(document).ready(function() {
    var data = {
        nickname: "Binary",
        my_presence: {
            priority: 0,
            status: 'Hey ho!',
            show: 'dnd'
        },
        roster: {

        }
    };
    window.data = data; // XXX
    $('body').html(yr.run('main', data));
});
