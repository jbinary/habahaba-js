"use strict";
require(['habahaba', 'jslix/disco'], function(habahaba, Disco) {
    var plugin = function(dispatcher, data) {
            this._dispatcher = dispatcher;
            this.data = data;
        },
        attrs = {};

    attrs.load = function() {
        this.disco = this._dispatcher.registerPlugin(Disco);
        var identity = this.disco.IdentityStanza.create({
            category: 'client',
            type: 'web',
            name: 'Habahaba'
        });
        this.disco.registerIdentity(identity);
        this.disco.init();
    }

    attrs.unload = function() {
        this._dispatcher.unregisterPlugin(Disco);
    }

    habahaba.Plugin(
        {
            name: 'disco'
        }, plugin, attrs);
})();
