"use strict";
(function() {
    var plugin = function(jslix_dispatcher, data) {
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
                update_chatstate({tab: tab, state: 'gone'});
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
                update_chatstate({tab: tab, state: 'active'});
                return true;
            },
            send_message: function(text, tab) {
                if (!text.length) return;
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
            },
            chat_keyup: function(e) {
                var $this = $(this);
                var tab = new Model('.view.tabs').get($this.attr('data-tab'));
                if (e.keyCode == 13 && !e.shiftKey) {
                    e.preventDefault();
                    var msg = $this.val();
                    $this.val('');
                    update_chatstate({tab: tab, state: 'active'});
                    habahaba.view.send_message($.trim(msg), tab);
                } else {
                    update_chatstate({tab: tab, state: 'composing'});
                }
            }
        }

        var _modelEngine = habahaba.view_start();
        var Model = _modelEngine.Model;
        var dispatcher = _modelEngine.dispatcher;

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
                if (value !== undefined) {
                    avalues.push(value);
                }
            }
            if (avalues.length) {
                var max = Math.max.apply(null, avalues);
                return [values[max]];
            } else if (undefined in values) {
                return [values[undefined]];
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
            var res;
            if (date.length) {
                date = date[0];
                res = moment(date.data).format(format_string);
            } else {
                res = 'None';
            }
            return res;
        }

        var require = function(plugin_name, to_execute) {
            if (data.loaded_plugins[plugin_name]) {
                to_execute(data.loaded_plugins[plugin_name]);
            }
        }

        var update_chatstate = function(state_obj) {
            require('chatstates', function(plugin) {
                var jid;
                if (state_obj.jid) {
                    jid = state_obj.jid;
                } else if (state_obj.tab && state_obj.tab.type == 'contact') {
                    var roster_item = new Model('.roster.items').
                                        get(state_obj.tab.roster_item_id);
                    if (roster_item) {
                        jid = roster_item.jid;
                    }
                }
                if (jid) {
                    plugin.update_my_activity(state_obj.state, jid);
                }
            });
        }

        // When .messages.contacts is updated, we need to autoscroll
        // and update unread status
        dispatcher.bind(['model:.messages.contacts:changed',
                         'model:.messages.contacts:added'], function(model) {
            var roster_item = new Model('.roster.items').get(model.roster_item_id);

            // Update unread if it's necessary
            var tab = new Model('.view.tabs').get({
                roster_item_id: model.roster_item_id
            });
            if (!tab || tab.prevent_auto_scroll || !tab.active) {
                roster_item.unread = true;
                roster_item.set();
            }

            habahaba.view.autoscroll(roster_item);
        });

        // When prevent_autoscroll is reset or inactive tab became active then
        // we need to reset the unread flag too
        var update_unread = function(tab) {
            if (!tab.prevent_auto_scroll && tab.active) {
                var roster_item = new Model('.roster.items').get(tab.roster_item_id);
                if (!roster_item) return;
                roster_item.unread = false;
                roster_item.set(false);
            }
        }
        dispatcher.bind('model:.view.tabs:attr-changed:prevent_auto_scroll',
                        update_unread);
        dispatcher.bind('model:.view.tabs:attr-changed:active',
                        update_unread);
    }

    plugin._name = 'habahaba.desktop_view';
    plugin.provides = ['view', 'view.chatstates'];
    habahaba.plugins[plugin._name] = plugin;
    // TODO: dependency engine
    habahaba.plugins_init_order.push(plugin._name);
})();
