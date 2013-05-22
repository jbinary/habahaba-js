"use strict";
(function() {
    var plugin = function(dispatcher, data) {
            this._dispatcher = dispatcher;
            this.data = data;
        },
        fields = {};
    
    fields.load = function() {
        if (!jslix.Disco) {
            throw new Error('jslix.disco was not loaded');
        }
        this.disco = this._dispatcher.registerPlugin(jslix.Disco);
        var identity = this.disco.IdentityStanza.create({
            category: 'client',
            type: 'web',
            name: 'Habahaba'
        });
        this.disco.registerIdentity(identity);
        this.disco.init();
    }

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(jslix.disco);
    }

    habahaba.Plugin(
        {
            name: 'disco'
        }, plugin, fields);
})();
