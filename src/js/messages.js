"use strict";
(function() {
    var habahaba = window.habahaba;
    var jslix = window.jslix;
    var Client = habahaba.Client;
    var WrongElement = jslix.exceptions.WrongElement;

    Client.Messages = function(dispatcher, data) {
        this.data = data;
        this.dispatcher = dispatcher;
    }

    var Messages = Client.Messages;
    Messages._name = 'Client.Messages';

    Messages.prototype.init = function() {
        this.data.messages = {
            contacts: []
        }
        this.dispatcher.addHandler(this.message_stanza, this, Messages._name);
    }

    Messages.prototype.message_stanza = jslix.Element({
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
        clean_delay: function(value) {
            if (value) return value;
            value = jslix.delayed.stanzas.delay.create({
                stamp: new Date()
            });
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
            this.update_chat_history(message, roster_item);
            return; // TODO: EmptyStanza?
        }
    }, [jslix.stanzas.message, jslix.delayed.stanzas.mixin]);

    Messages.prototype.update_chat_history = function(message, roster_item) {
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
        var message = habahaba.onlyFields(message);
        messages.history.push(message); // TODO: collect garbage
        messages.set();
    }

    Messages.prototype.send_chat_message = function(text, roster_item) {
        var msg = this.message_stanza.create({
            type: 'chat',
            to: roster_item.jid,
            body: text,
            delay: {
                stamp: new Date()
            }
        });
        this.dispatcher.send(msg);
        this.update_chat_history(msg, roster_item);
    }

})();
