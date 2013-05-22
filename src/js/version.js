"use strict";
(function() {
    var plugin = function(dispatcher, data) {
            this._dispatcher = dispatcher;
            this.data = data;
        },
        fields = {};

    fields.load = function() {
        // TODO: check that jslix.version was loaded
        var options = {
            name: 'Habahaba',
            version: '0.0.1' // TODO: remove hardcode
        }
        var disco_plugin = this.data.loaded_plugins.disco;
        if (disco_plugin) {
            options.disco_plugin = this.data.loaded_plugins.disco.disco;
        }
        this.version = this._dispatcher.registerPlugin(jslix.Version, options);
        this.version.init();
    }

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(jslix.version);
    }

    habahaba.Plugin({
            name: 'version',
            weak_dependecies: ['disco']
        }, plugin, fields);
})();
