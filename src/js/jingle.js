"use strict";
require(['habahaba', 'jslix/jingle', 'models'],
        function(habahaba, Jingle, models) {
    var Model = models.Model,
        RosterItem;

    habahaba.Plugin({
        name: 'jingle',
        weak_dependecies: ['disco'],
        depends: ['view.rtc', 'roster']
    },
    function(dispatcher, data) {
        this._dispatcher = dispatcher;
        this._data = data;
    },
    {
        load: function() {
            var that = this;
            var cb_fab = function(cb) {
                return function() {
                    return cb.apply(that, Array.prototype.slice.call(arguments));
                }
            }
            navigator.userMedia = (navigator.getUserMedia ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia);
            navigator.userMedia({
                    audio: true,
                    video: false
                },
                cb_fab(this.onUserMediaSuccess),
                cb_fab(this.onUserMediaError)
            );
            var plugins = this._data.loaded_plugins;
            this.jingle = this._dispatcher.registerPlugin(
                Jingle,
                {
                    acceptSessionCallback: this.acceptSessionCallback
                }
            );
            this.jingle.init();
            RosterItem = plugins.roster.RosterItem;
        },
        acceptSessionCallback: function(jingle_query) {
            return this.localStream ? [this.localStream] : false;
        },
        onUserMediaSuccess: function(stream) {
            this.localStream = stream;
        },
        onUserMediaError: function(error) {
            // TODO: proper logging
            console.log('Failed to get user media', error);
        },
        initiate: function(contact_pk) {
            var roster_item = new RosterItem().get(contact_pk);
            if (!this.localStream || !roster_item) {
                return;
            }
            var jid = roster_item.getIQJID();
            // TODO: handle errors
            this.jingle.initiate(jid, [this.localStream]);
        }
    });
});
