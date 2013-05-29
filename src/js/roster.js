"use strict";
require(['jslix/exceptions', 'libs/signals',
         'jslix/roster', 'jslix/stanzas',
         'jslix/jid', 'habahaba'],
        function(exceptions, signals, Roster, stanzas, JID, habahaba) {
    var WrongElement = exceptions.WrongElement,
        Signal = signals.Signal,
        Model;

    var plugin = function(dispatcher, data) {
            this.dispatcher = dispatcher;
            this.data = data;
        },
        fields = {};

    fields.signals = {
        got: new Signal()
    };

    fields.load = function() {
        this.Model = Model = this.data.loaded_plugins.view.Model;
        this.data.roster = {
            items: [
                {
                    groups: [-1],
                    jid: this.data.my_jid,
                    nick: this.data.nickname,
                    pk: 0,
                    presences: [],
                    subscription: 'both'
                    // TODO: avatar_hash
                }
            ],
            groups: [
                {
                    name: 'Undefined',
                    pk: 0,
                    special_group: 'undefined'
                },
                {
                    name: 'Self contact',
                    pk: -1,
                    special_group: 'self-contact',
                    hidden: true
                },
                {
                    name: 'Not in Roster',
                    pk: -2,
                    special_group: 'not-in-roster'
                }
            ]
        };
        this.roster = new Roster(this.dispatcher);
        this.roster.signals.got.add(this.got_roster, this);
        this.roster.signals.updated.add(this.roster_updated, this);
        this.dispatcher.addHandler(this.Presence, this, 'habahaba.roster');
        this.roster.init();
    }

    fields.unload = function() {
        this.dispatcher.unregisterPlugin('habahaba.roster');
    }

    fields.Presence = stanzas.Element({
        clean_type: function(value) {
            if (['unavailable', undefined].indexOf(value) == -1)
                 throw new WrongElement();
            return value;
        },
        anyHandler: function(presence) {
            var roster_item = new Model('.roster.items').getAll();
            roster_item = roster_item.filter(function(item) {
                return (item.jid.bare == presence.from.bare)
            });
            if (roster_item.length != 1) return; // TODO: EmptyStanza?
            roster_item = roster_item[0];

            var presences = roster_item.presences.slice();
            var resource = presences.filter(function(p) {
                return p.from.resource == presence.from.resource;
            });
            presence = habahaba.onlyFields(presence);
            if (!resource.length) {
                presences.push(presence);
            } else {
                // FIXME: remove obsolete unavailable presences
                presences[presences.indexOf(resource[0])] = presence;
            }
            roster_item.presences = presences;
            roster_item.set();
        }
    }, [stanzas.PresenceStanza]);

    var _prepare_roster_item = function(item, silently, old_item) {
        var groups = [];
        for (var gi=0; gi<item.groups.length; gi++) {
            var model = new Model('.roster.groups');
            var group = model.get({name: item.groups[gi]});
            if (!group) {
                group = model.new();
                group.name = item.groups[gi];
                group.set(silently);
            }
            groups.push(group.pk);
        }
        if (!item.groups.length) {
            var group = new Model('.roster.groups');
            group = group.get({special_group: 'undefined'})
            groups.push(group.pk);
        }
        if (item.subscription == 'remove') {
            if (old_item) old_item.del();
        } else {
            model = old_item || new Model('.roster.items').new();
            model.fromDocument(item);
            if (!old_item)
                model.presences = [];
            else
                model.presences = old_item.presences;
            model.groups = groups;
            model.set(silently);
        }
    }

    fields.get_roster_item = function(jid) {
        // TODO: indexes may be useful here to make it faster
        var all_items = new Model('.roster.items').getCollection();
        if (typeof(jid) == 'string') {
            jid = new JID(jid);
        }
        var the_item;
        $.each(all_items, function() {
            the_item = (this.jid.node == jid.node && 
                    this.jid.domain == jid.domain) ? this : undefined;
            if (the_item) return false;
        });
        return the_item && new Model('.roster.items').get(the_item.pk);
    }

    fields.roster_updated = function(items) {
        for (var i=0; i<items.length; i++) {
            var item = items[i];
            var the_item = this.get_roster_item(item.jid);
            _prepare_roster_item(item, false, the_item);
        }
    }

    fields.got_roster = function(items) {
        for (var i=0; i<items.length; i++) {
            var item = items[i];
            _prepare_roster_item(item, i<items.length-1);
        }
        this.changeStatus();
        this.signals.got.dispatch();
    }

    fields.changeStatus = function() {
        this.dispatcher.send(stanzas.PresenceStanza.create({}));
    }

    habahaba.Plugin({
        name: 'roster',
        weak_dependecies: ['view.roster'],
        depends: ['view']
    }, plugin, fields);
})();
