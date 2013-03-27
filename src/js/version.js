"use strict";
(function() {
    var plugin = function(dispatcher, data) {
        this._dispatcher = dispatcher;
        this.data = data;
    }
    plugin._name = 'version';
    plugin.weak_dependecies = ['disco'];

    plugin.prototype.load = function() {
        // TODO: check that jslix.version was loaded
        var options = {
            name: 'Habahaba',
            version: '0.0.1' // TODO: remove hardcode
        }
        var disco_plugin = this.data.loaded_plugins.disco;
        if (disco_plugin) {
            options.disco_plugin = this.data.loaded_plugins.disco.disco;
        }
        this.version = this._dispatcher.registerPlugin(jslix.version, options);
        this.version.init();
    }

    plugin.prototype.unload = function() {
        this._dispatcher.unregisterPlugin(jslix.version);
    }

    habahaba.plugins[plugin._name] = plugin;
    // TODO: dependency engine
    habahaba.plugins_init_order.push(plugin._name);
})();
