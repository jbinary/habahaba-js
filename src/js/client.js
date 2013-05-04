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
        },
        loaded_plugins: {}
    };

    habahaba.Client = function() {
        jslix.Client.apply(this, arguments);
        this.data = data;
        this.data.my_jid = this.connection.jid;
        this.storage = new Storage(localStorage, 'habahaba');
        this.account_storage = this.storage.chroot(
            'accounts',
            this.dispatcher.connection.jid.getBareJID()
        );
    }

    var Client = habahaba.Client;

    Client._name = 'habahaba.Client';
    Client.prototype = new jslix.Client();
    Client.prototype.constructor = Client;

    Client.prototype.init = function() {
        this.messages = new habahaba.Client.Messages(this.dispatcher, this.data);
        this.messages.init();

        var that = this;
        // Init plugins
        // TODO: dependency engine
        $.each(habahaba.plugins_init_order, function() {
            var storage = that.storage.chroot(this),
                account_storage = that.account_storage.chroot(this),
                plugin = new habahaba.plugins[this](that.dispatcher, data,
                                                    storage,
                                                    account_storage);
            if (plugin.load) {
                plugin.load(); // TODO: handle errors
            }
            data.loaded_plugins[this] = plugin;
        });
    }

    Client.prototype.connect = function() {
        var d = $.Deferred();
        var that = this;
        this.connection.connect(this.dispatcher).done(function() {
            that.init();
            d.resolve.apply(d, arguments);
        }).fail(function() {
            d.reject.apply(d, arguments);
        });
        return d;
    }

})();
