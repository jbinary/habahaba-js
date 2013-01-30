"use strict";
(function(){
    var habahaba = window.habahaba;
    var jslix = window.jslix;
    var Client = habahaba.Client;

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
    }

    Client.prototype.got_roster = function(roster) {
        for (var i=0; i<roster.items.length; i++) {
            var item = roster.items[i];
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
            var model = new Model('.roster.items').new();
            model.fromDocument(item);
            model.presences = [];
            model.groups = groups;
            model.set();
        }
    }
})();
