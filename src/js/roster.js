"use strict";
(function(){
    var habahaba = window.habahaba;
    var jslix = window.jslix;
    var WrongElement = jslix.exceptions.WrongElement;
    var Client = habahaba.Client;

    var presence = jslix.Element({
        clean_type: function(value) {
            if (['unavailable', undefined].indexOf(value) == -1)
                 throw new WrongElement();
            return value;
        },
        anyHandler: function(presence) {
            var roster_item = new Model('.roster.items').getAll();
            roster_item = roster_item.filter(function(item) {
                return (item.jid.getBareJID() == presence.from.getBareJID()) 
            });
            if (roster_item.length != 1) return; // TODO: EmptyStanza?
            roster_item = roster_item[0];

            var presences = roster_item.presences.slice();
            var resource = presences.filter(function(p) {
                return p.from.getResource() == presence.from.getResource();
            });
            if (!resource.length) {
                presences.push(presence);
            } else {
                // FIXME: remove obsolete unavailable presences
                presences[presences.indexOf(resource[0])] = presence;
            }
            roster_item.presences = presences;
            roster_item.set();
        }
    }, [jslix.stanzas.presence]);

    Client.prototype.init_roster = function() {
        this.data.roster = {
            items: [],
            groups: [
                {
                    name: 'Undefined',
                    pk: 0,
                    special_group: 'undefined'
                }
            ]
        };
        this.roster = new jslix.roster(this.dispatcher);
        this.roster.signals.got.add(this.got_roster);
        this.roster.signals.updated.add(this.roster_updated);
        this.dispatcher.addHandler(presence, this, 'client.roster');
    }

    var _prepare_roster_item = function(item, old_item) {
        var groups = [];
        for (var gi=0; gi<item.groups.length; gi++) {
            var model = new Model('.roster.groups');
            var group = model.get({name: item.groups[gi]});
            if (!group) {
                group = model.new();
                group.name = item.groups[gi];
                group.set();
            }
            groups.push(group.pk);
        }
        if (!item.groups.length) {
            var group = new Model('.roster.groups');
            group = group.get({special_group: 'undefined'})
            groups.push(group.pk);
        }
        model = old_item || new Model('.roster.items').new();
        model.fromDocument(item);
        if (!old_item)
            model.presences = [];
        else
            model.presences = old_item.presences;
        model.groups = groups;
        model.set();
    }

    Client.prototype.roster_updated = function(items) {
        var all_items = new Model('.roster.items').getAll();
        for (var i=0; i<items.length; i++) {
            var item = items[i];
            var the_item = all_items.filter(function(citem) {
                return (citem.jid.getBareJID() == item.jid.getBareJID())
            });
            if (the_item.length)
                the_item = the_item[0]
            else {
                the_item = undefined;
            }
            _prepare_roster_item(item, the_item);
        }
    }

    Client.prototype.got_roster = function(items) {
        for (var i=0; i<items.length; i++) {
            var item = items[i];
            _prepare_roster_item(item);
        }
    }
})();
