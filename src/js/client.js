"use strict";
(function(){
    var habahaba = window.habahaba;
    var jslix = window.jslix;
    var data = {
        nickname: "Binary",
        my_presence: {
            priority: 0,
            status: 'Hey ho!',
            show: 'dnd'
        }
    };

    habahaba.Client = function() {
        jslix.Client.apply(this, arguments);
        this.data = data;
        this.storage = new Storage(sessionStorage, 'habahaba');
        this.account_storage = this.storage.chroot(
            'accounts',
            this.dispatcher.connection.jid.getBareJID()
        );
        this.init_roster(); // TODO: init roster only if appropriate file is
                            // loaded
        this.init_messages();
        var that = this;
        this.roster.signals.got.add(function() {
            that.changeStatus();
        });
    }
    var Client = habahaba.Client;

    Client._name = 'habahaba.Client';

    Client.prototype = new jslix.Client();

    Client.prototype.constructor = Client;

    Client.prototype.connect = function() {
        var d = $.Deferred();
        var that = this;
        this.connection.connect(this.dispatcher).done(function() {
            that.roster.init();
            d.resolve.apply(d, arguments);
        }).fail(function() {
            d.reject.apply(d, arguments);
        });
        return d;
    }

    Client.prototype.changeStatus = function() {
        this.dispatcher.send(jslix.stanzas.presence.create({}));
    }

})();
