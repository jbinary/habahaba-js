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
        if ('disco' in this.data.loaded_plugins) {
            this.data.loaded_plugins.disco.disco.registerFeature(this.XHTML_NS);
        }
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
                this.sanitize_xhtml(message.html);
            }
            this.update_chat_history(message, roster_item);
            return; // TODO: EmptyStanza?
        }
    }, [jslix.stanzas.MessageStanza, jslix.delayed.stanzas.mixin]);

    // From the XEP-0071
    // XXX: Some attributes may need to be sanitized better. For example, id.
    fields.xhtml_profile = {
        'body': ['class', 'id', 'title', 'style'],
        'head': ['profile'],
        'html': ['version'],
        'title': [],

        'abbr': ['class', 'id', 'title', 'style'],
        'acronym': ['class', 'id', 'title', 'style'],
        'address': ['class', 'id', 'title', 'style'],
        'blockquote': ['class', 'id', 'title', 'style', 'cite'],
        'br': ['class', 'id', 'title', 'style'],
        'cite': ['class', 'id', 'title', 'style'],
        'code': ['class', 'id', 'title', 'style'],
        'dfn': ['class', 'id', 'title', 'style'],
        'div': ['class', 'id', 'title', 'style'],
        'em': ['class', 'id', 'title', 'style'],
        'h1': ['class', 'id', 'title', 'style'],
        'h2': ['class', 'id', 'title', 'style'],
        'h3': ['class', 'id', 'title', 'style'],
        'h4': ['class', 'id', 'title', 'style'],
        'h5': ['class', 'id', 'title', 'style'],
        'h6': ['class', 'id', 'title', 'style'],
        'kbd': ['class', 'id', 'title', 'style'],
        'p': ['class', 'id', 'title', 'style'],
        'pre': ['class', 'id', 'title', 'style'],
        'q': ['class', 'id', 'title', 'style', 'cite'],
        'samp': ['class', 'id', 'title', 'style'],
        'span': ['class', 'id', 'title', 'style'],
        'strong': ['class', 'id', 'title', 'style'],
        'var': ['class', 'id', 'title', 'style'],

        'a': ['class', 'id', 'title', 'style', 'accesskey', 'charset',
              'href', 'hreflang', 'rel', 'rev', 'tabindex', 'type'],

        'dl': ['class', 'id', 'title', 'style'],
        'dt': ['class', 'id', 'title', 'style'],
        'dd': ['class', 'id', 'title', 'style'],
        'ol': ['class', 'id', 'title', 'style'],
        'ul': ['class', 'id', 'title', 'style'],
        'li': ['class', 'id', 'title', 'style'],

        'img': ['class', 'id', 'title', 'style', 'alt', 'height', 'longdesc',
                'src', 'width']
    }

    fields.sanitize_xhtml = function(html) {
        // Remove all inappropriate tags and attributes from a message
        for (var i=html.childNodes.length - 1; i>=0; i--) {
            var el = html.childNodes[i];
            if (el.localName in this.xhtml_profile) {
                var allowed_attrs = this.xhtml_profile[el.localName];
                for (var ai=el.attributes.length - 1; ai>=0; ai--) {
                    var name = el.attributes[ai].name;
                    // We can't allow to put foreign IDs because it can break
                    // the DOM.
                    if (name == 'id' || allowed_attrs.indexOf(name) == -1) {
                        el.attributes.removeNamedItem(name);
                    }
                }
                this.sanitize_xhtml(el);
            } else if (el.nodeType == 1) {
                html.removeChild(el);
                for (var ci=0; ci<el.childNodes.length; ci++) {
                    var child = el.childNodes[0];
                    html.appendChild(child);
                    this.sanitize_xhtml(child);
                }
            }
        }
    }

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
        // XXX: we won't be able to process body's styles and doc's head
        // this way. What can we do?
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
