"use strict";
(function() {
    var plugin = function(dispatcher, data) {
        this._dispatcher = dispatcher;
    }
    plugin._name = 'disco';
    
    plugin.prototype.load = function() {
        // TODO: check that jslix.disco was loaded
        this.disco = this._dispatcher.registerPlugin(jslix.disco);
        var identity = jslix.disco.stanzas.identity.create({
            category: 'client',
            type: 'web',
            name: 'Habahaba'
        });
        this.disco.registerIdentity(identity);
        this.disco.init();
    }

    plugin.prototype.unload = function() {
        this._dispatcher.unregisterPlugin(jslix.disco);
    }

    habahaba.plugins[plugin._name] = plugin;
    // TODO: dependency engine
    habahaba.plugins_init_order.push(plugin._name);
})();
