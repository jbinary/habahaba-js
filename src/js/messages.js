"use strict";
(function() {
    var habahaba = window.habahaba,
        jslix = window.jslix,
        WrongElement = jslix.exceptions.WrongElement,
        Model,
        JID = jslix.JID;

    var plugin = function(dispatcher, data) {
            this.data = data;
            this.dispatcher = dispatcher;
        },
        fields = {};

    fields.XHTML_NS = 'http://jabber.org/protocol/xhtml-im';

    fields.load = function() {
        this.Model = Model = this.data.loaded_plugins.view.Model;
        this.data.messages = {
            contacts: []
        }
        this.dispatcher.addHandler(this.message_stanza, this, plugin._name);
    }

    fields.unload = function() {
        this.dispatcher.unregisterPlugin(plugin._name);
    }

    fields.message_stanza = jslix.Element({
        html: new jslix.fields.Node('html', fields.XHTML_NS),

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
            var roster_item = new Model('.roster.items'),
                bareJID = message.from.getBareJID();
            roster_item = roster_item.filter({
                jid: bareJID
            }).execute();
            if (!roster_item.length) {
                var group = new Model('.roster.groups').filter({
                    special_group: 'not-in-roster'
                }).execute()[0];
                roster_item = new Model('.roster.items').new();
                roster_item.jid = new JID(bareJID);
                roster_item.presences = [];
                roster_item.subscription = 'none';
                roster_item.groups = [group.pk];
                roster_item.set(true);
            } else {
                roster_item = roster_item[0];
            }
            if (!message.html) {
                message.html = this.plain_to_xhtml(message.body);
            } else {
                // TODO XXX: sanitize incoming XHTML
                message.html = this.plain_to_xhtml(message.body);
            }
            this.update_chat_history(message, roster_item);
            return; // TODO: EmptyStanza?
        }
    }, [jslix.stanzas.message, jslix.delayed.stanzas.mixin]);

    fields.plain_to_xhtml = function(message) {
        var doc = $('<html>').html('<body></body>'),
            body = doc.find('body')[0],
            splitted = message.split('\n');
        for (var i=0; i<splitted.length; i++) {
            var para = document.createElement('p');
            $(para).text(splitted[i]);
            body.appendChild(para);
        }
        return doc[0];
    }

    fields.update_chat_history = function(message, roster_item) {
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
        message.xhtml_string = $('body', message.html).html();
        messages.history.push(message); // TODO: collect garbage
        messages.set();
    }

    fields.send_chat_message = function(text, roster_item) {
        var msg = this.message_stanza.create({
            type: 'chat',
            to: roster_item.jid,
            body: text,
            delay: {
                stamp: new Date()
            }
        });
        this.dispatcher.send(msg);
        msg.html = this.plain_to_xhtml(text);
        this.update_chat_history(msg, roster_item);
    }

    habahaba.Plugin(
        {
            name: 'messages',
            depends: ['view']
        }, plugin, fields);
})();
