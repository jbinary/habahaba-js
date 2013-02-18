"use strict";
(function() {
    var habahaba = window.habahaba;
    var jslix = window.jslix;
    var Client = habahaba.Client;
    var WrongElement = jslix.exceptions.WrongElement;

    var message = jslix.Element({
        clean_body: function(value) {
            if (!value && value !== '')
                throw new WrongElement('Body is absent')
            return value;
        },
        clean_type: function(value) {
            if ([undefined, 'chat', 'normal'].indexOf(value) == -1)
                throw new WrongElement('Only chat and normal messages')
            return value;
        },
        anyHandler: function(message) {
            var roster_item = new Model('.roster.items');
            roster_item = roster_item.filter({
                jid: message.from.getBareJID()
            }).execute();
            if (!roster_item.length) return; // TODO: add unknown contact
                                             // to the roster
            roster_item = roster_item[0];
            var messages = new Model('.messages.contacts');
            messages = messages.filter({
                roster_item_id: roster_item.pk
            }).execute();
            if (!messages.length) {
                messages = new Model('.messages.contacts').new();
                messages.history = [];
                messages.roster_item_id = roster_item.pk;
            } else {
                messages = messages[0];
            }
            messages.history.push(message); // TODO: collect garbage
            messages.set();
            return; // TODO: EmptyStanza?
        }
    }, [jslix.stanzas.message]);

    var that;
    Client.prototype.init_messages = function() {
        this.data.messages = {
            contacts: []
        }
        this.dispatcher.addHandler(message, this, 'client.messages');
        that = this;
    }
})();
