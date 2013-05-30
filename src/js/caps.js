"use strict";
require(['habahaba', 'jslix/caps'], function(habahaba, Caps) {
    var plugin = function(dispatcher, data, storage) {
            this._dispatcher = dispatcher;
            this._data = data;
            this._storage = storage;
        },
        fields = {};

    fields.load = function() {
        var disco_plugin = this._data.loaded_plugins.disco,
            options = {
                disco_plugin: disco_plugin.disco,
                storage: this._storage,
                // TODO: specify this
                node: 'http://dev.habahaba.im/'
            };
        this.caps = this._dispatcher.registerPlugin(Caps, options);
    }

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(this.caps);
    }

    habahaba.Plugin({
        name: 'caps',
        depends: ['disco', 'roster']
    }, plugin, fields);
});
