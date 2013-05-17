"use strict";
(function() {
    var habahaba = window.habahaba,
        jslix = window.jslix,
        WrongElement = jslix.exceptions.WrongElement,
        Model;

    var plugin = function(dispatcher, data) {
        this.data = data;
        this.dispatcher = dispatcher;
    }

    plugin._name = 'messages';
    plugin.depends = ['view'];

    plugin.prototype.load = function() {
        this.Model = Model = this.data.loaded_plugins.view.Model;
        this.data.messages = {
            contacts: []
        }
        this.dispatcher.addHandler(this.message_stanza, this, plugin._name);
    }

    plugin.prototype.unload = function() {
        this.dispatcher.unregisterPlugin(plugin._name);
    }

    plugin.prototype.message_stanza = jslix.Element({
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

    plugin.prototype.update_chat_history = function(message, roster_item) {
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

    plugin.prototype.send_chat_message = function(text, roster_item) {
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

    habahaba.plugins[plugin._name] = plugin;
    // TODO: dependency engine
    habahaba.plugins_init_order.push(plugin._name);
})();
