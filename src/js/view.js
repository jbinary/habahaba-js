"use strict";
(function() {
    var plugin = function(dispatcher, data) {
        habahaba.view = {
            collapse_group: function(gpk) {
                var collapsedGroup = new Model('.view.collapsed_groups').get(gpk);
                if (!collapsedGroup) {
                    var collapsedGroup = new Model('.view.collapsed_groups');
                    collapsedGroup.pk = gpk;
                    collapsedGroup.set();
                } else {
                    collapsedGroup.del();
                }
            },
            open_contact: function(item_id, activate) {
                var contact = new Model('.roster.items').get(item_id);
                if (!contact) return false;
                var tabs = new Model('.view.tabs').getAll();
                var tab = tabs.filter(function(tab) {
                    return tab.type == 'contact' && tab.roster_item_id == item_id;
                })
                if (!tab.length) {
                    var tab = new Model('.view.tabs').new();
                    tab.type = 'contact';
                    tab.roster_item_id = item_id;
                    tab.set(!!activate);
                } else {
                    tab = tab[0];
                }
                if (activate) {
                    habahaba.view.activate_tab(tab.pk); 
                }
                return true;
            },
            close_tab: function(tab_id) {
                var tabs = new Model('.view.tabs').getAll();
                var tab;
                $.each(tabs, function() {
                    if (this.pk == tab_id) tab = this;
                });
                if (!tab) return;
                var index = tabs.indexOf(tab);
                var a_tab = tabs[index + 1] || tabs[index - 1];
                tab.del();
                if (a_tab) {
                    habahaba.view.activate_tab(a_tab.pk);
                }
                return true;
            },
            activate_tab: function(tab_id) {
                var tab = new Model('.view.tabs').get(tab_id);
                if (!tab) return;
                var tabs = new Model('.view.tabs').getAll();
                for (var i=0; i<tabs.length; i++) {
                    var ctab = tabs[i];
                    if (ctab.active && ctab.pk != tab.pk) {
                        ctab.active = false;
                        ctab.set(true);
                        break;
                    } else if (ctab.active && ctab.pk == tab.pk) {
                        return true;
                    }
                }
                tab.active = true;
                tab.set();
                return true;
            },
            send_message: function(text, tab_id) {
                if (!text.length) return;
                var tab = new Model('.view.tabs').get(tab_id);
                if (!tab || tab.type != 'contact') return;
                var contact = new Model('.roster.items').get(tab.roster_item_id);
                if (!contact) return;
                habahaba.client.messages.send_chat_message(text, contact);
                return true;
            },
            autoscroll: function(roster_item) {
                var tab = new Model('.view.tabs').get({roster_item_id: roster_item.pk,
                                                       active: true});
                if (!tab) return;
                var block = $('#dialog-block-' + tab.pk);
                if (!tab.prevent_auto_scroll) {
                    block.animate({
                        scrollTop: $('.dialog-block').prop('scrollHeight')
                    }, 'fast');
                    block.promise().always(function() {
                        tab.prevent_auto_scroll = undefined;
                        tab.set(true);
                    });
                }
            }
        }

        // External functions for yate
        yr.externals.count = function(nodeset) {
            return nodeset.length;
        }

        yr.externals.max_priority = function(nodes) {
            var values = {};
            var avalues = [];
            for (var i=0, l=nodes.length; i<l; i++) {
                var node = nodes[i];
                var value = node.data.priority;
                if (node.data.type == 'unavailable') value = undefined;
                values[value] = node;
                if (value !== undefined)
                    avalues.push(value);
            }
            if (avalues.length) {
                var max = Math.max.apply(null, avalues);
                return [values[max]];
            } else if (undefined in values) {
                return [values[undefined]]
            }
            return [];
        }

        yr.externals.splitlines = function(string) {
            string = string.split('\n');
            for (var i=0; i<string.length; i++) {
                string[i] = {data: string[i]}
            }
            return string;
        }

        yr.externals.formatDate = function(date, format_string) {
            return moment(date.data).format(format_string);
        }
    }
    plugin._name = 'habahaba.desktop_view';
    plugin.provides = ['view'];
    habahaba.plugins[plugin._name] = plugin;
    // TODO: dependency engine
    habahaba.plugins_init_order.push(plugin._name);
})();
