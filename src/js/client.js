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
                Plugin = habahaba.plugins[this],
                provides = Plugin.metadata.provides || [],
                plugin = new Plugin.plugin(that.dispatcher, data, storage, 
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

    var RegisterPluginForLoad = function(plugin) {
        // TODO: dependency engine
        habahaba.plugins_init_order.push(plugin.metadata.name);
    }

    var Plugin = function(metadata, constructor, fields, parent, abstract) {
        var parent = parent || {
                plugin: {},
                metadata: {}
            },
            fields = fields || {};
        var metadata = new (jslix.Class(parent.metadata, function() {},
                                        metadata));
        fields['metadata'] = metadata;
        var plugin = jslix.Class(parent.plugin, constructor, fields),
            result = {
                metadata: metadata,
                plugin: plugin
            }
        if (!abstract) {
            habahaba.plugins[metadata.name] = result;
            // TODO: Make it possible to not load a plugin automatically
            // need to provide some list of automatically loaded plugins
            // someway
            RegisterPluginForLoad(result);
        }
        return result;
    }
    habahaba.Plugin = Plugin;
})();
