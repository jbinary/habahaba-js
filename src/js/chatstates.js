"use strict";
(function() {
    var plugin = function(dispatcher, data) {
        this._dispatcher = dispatcher;
        this.data = data;
    }
    plugin._name = 'chatstates';
    plugin.weak_dependecies = ['disco', 'view'];
    plugin.depends = ['view.chatstates'];

    plugin.prototype.load = function() {
        // TODO: check that jslix.Chatstates was loaded
        var options = {};
        var disco_plugin = this.data.loaded_plugins.disco;
        // TODO: some shortcut here?
        if (disco_plugin) {
            options.disco_plugin = this.data.loaded_plugins.disco.disco;
        }
        this.chatstates = this._dispatcher.registerPlugin(jslix.Chatstates,
                                                          options);
        this.chatstates.init();
        jslix.Chatstates.signals.updated.add(this.updated);
    }

    plugin.prototype.update_my_activity = function(state, jid) {
        this.chatstates.update_my_activity(state, jid);
    }

    plugin.prototype.unload = function() {
        this._dispatcher.unregisterPlugin(jslix.Chatstates);
        // TODO: remove signal handler?
    }

    plugin.prototype.updated = function(jid, state) {
        var contact = new Model('.roster.items').get({
            jid: jid.getBareJID()
        });
        if (contact) {
            contact.chatstate = state;
            contact.set();
        }
    }

    habahaba.plugins[plugin._name] = plugin;
    // TODO: dependency engine
    habahaba.plugins_init_order.push(plugin._name);
})();
