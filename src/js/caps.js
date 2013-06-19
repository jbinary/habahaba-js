"use strict";
require(['habahaba', 'jslix/caps', 'models'], function(habahaba, Caps, models) {
    var plugin = function(dispatcher, data, storage) {
            this._dispatcher = dispatcher;
            this._data = data;
            this._storage = storage;
        },
        Model = models.Model,
        fields = {};

    fields.load = function() {
        var loaded_plugins = this._data.loaded_plugins,
            disco_plugin = loaded_plugins.disco,
            options = {
                disco_plugin: disco_plugin.disco,
                storage: this._storage,
                // TODO: specify this
                node: 'http://dev.habahaba.im/'
            };
        this.caps = this._dispatcher.registerPlugin(Caps, options);
        this.caps.signals.caps_changed.add(this.capsChanged, this);
        this.roster = loaded_plugins.roster;
    }

    fields.capsChanged = function(jid, features) {
        var item = this.roster.get_roster_item(jid) || {},
            presence;
        $.each(item.presences || [], function() {
            if (this.from.resource == jid.resource) {
                presence = this;
                return false;
            }
        });
        if (presence !== undefined) {
            presence.features = features;
        debugger;
            item.set();
        }
    }

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(this.caps);
        // XXX: unregister signal handler
    }

    habahaba.Plugin({
        name: 'caps',
        depends: ['disco', 'roster']
    }, plugin, fields);
});
