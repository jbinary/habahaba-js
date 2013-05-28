"use strict";
require(['habahaba', 'jslix/chatstates'], function(habahaba, Chatstates) {
    var Model,
        plugin = function(dispatcher, data) {
            this._dispatcher = dispatcher;
            this.data = data;
        },
        fields = {};

    fields.load = function() {
        this.Model = Model = this.data.loaded_plugins.view.Model;
        // TODO: check that jslix.Chatstates was loaded
        var options = {};
        var disco_plugin = this.data.loaded_plugins.disco;
        // TODO: some shortcut here?
        if (disco_plugin) {
            options.disco_plugin = this.data.loaded_plugins.disco.disco;
        }
        this.chatstates = this._dispatcher.registerPlugin(Chatstates,
                                                          options);
        this.chatstates.init();
        this.chatstates.signals.updated.add(this.updated);
    }

    fields.update_my_activity = function(state, jid) {
        this.chatstates.update_my_activity(state, jid);
    }

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(Chatstates);
        // TODO: remove signal handler?
    }

    fields.updated = function(jid, state) {
        var contact = new Model('.roster.items').get({
            jid: jid.getBareJID()
        });
        if (contact) {
            contact.chatstate = state;
            contact.set();
        }
    }

    habahaba.Plugin(
        {
            name: 'chatstates',
            weak_dependecies: ['disco'],
            depends: ['view.chatstates', 'view']
        },
        plugin,
        fields);
})();
