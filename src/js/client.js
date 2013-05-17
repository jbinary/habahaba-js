"use strict";
(function(){
    var habahaba = {
        plugins: {},
        plugins_init_order: [], // TODO: dependency engine
        onlyFields: function(stanza) {
            var res = {};
            var definition = stanza.__definition__;
            for (var k in definition) {
                if (definition[k].field) {
                    var value = stanza[k];
                    if (value && value.__definition__)
                        res[k] = habahaba.onlyFields(value)
                    else
                        res[k] = value;
                }
            }
            return res;
        }
    };
    window.habahaba = habahaba;

    var jslix = window.jslix,
        data = {
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
        var that = this;
        this.data.nickname = this.dispatcher.connection.jid._node;
        // Init plugins
        // TODO: dependency engine
        $.each(habahaba.plugins_init_order, function() {
            var storage = that.storage.chroot('plugins', this),
                account_storage = that.account_storage.chroot('plugins', this),
                provides = habahaba.plugins[this].provides || [],
                plugin = new habahaba.plugins[this](that.dispatcher, data,
                                                    storage,
                                                    account_storage);
            if (plugin.load) {
                plugin.load(); // TODO: handle errors
            }
            $.each(provides.concat(this), function() {
                if (this in data.loaded_plugins) {
                    throw new Error('Conflict detected while loading plugins');
                } else {
                    data.loaded_plugins[this] = plugin;
                }
            });
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
