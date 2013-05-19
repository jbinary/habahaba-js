"use strict";
(function() {
    var plugin = function(dispatcher, data) {
            this._dispatcher = dispatcher;
        },
        fields = {};
    
    fields.load = function() {
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

    fields.unload = function() {
        this._dispatcher.unregisterPlugin(jslix.disco);
    }

    habahaba.Plugin(
        {
            name: 'disco'
        }, plugin, fields);
})();
