"use strict";
require(['habahaba', 'jslix/version'], function(habahaba, Version) {
    var plugin = function(dispatcher, data) {
            this._dispatcher = dispatcher;
            this.data = data;
        },
        fields = {};

    fields.load = function() {
        var options = {
            name: 'Habahaba',
            version: '0.0.1' // TODO: remove hardcode
        }
        var disco_plugin = this.data.loaded_plugins.disco;
        if (disco_plugin) {
            options.disco_plugin = this.data.loaded_plugins.disco.disco;
        }
        this.version = this._dispatcher.registerPlugin(Version, options);
        this.version.init();
    }

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(Version);
    }

    habahaba.Plugin({
            name: 'version',
            weak_dependecies: ['disco']
        }, plugin, fields);
})();
