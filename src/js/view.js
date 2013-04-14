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
                    tab.set(true);
                    tab.order = tab.pk;
                    tab.set();
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
                // Activate tab with given id, make it visible if needed
                var tab = new Model('.view.tabs').get(tab_id);
                if (!tab) return;
                var lis = $('#tabs li');
                var tabs = new Model('.view.tabs').getAll();
                tabs = tabs.sort(function(tab1, tab2) {
                    return tab1.order - tab2.order;
                });
                var tab_index = null;
                // Deactivate the tab that was active before
                for (var i=0; i<tabs.length; i++) {
                    var ctab = tabs[i];
                    if (ctab.active && ctab.pk != tab.pk) {
                        ctab.active = false;
                        ctab.set(true);
                    } else if (ctab.pk == tab.pk) {
                        tab_index = i;
                    }
                }

                var offset = undefined;
                // Tab is hidden, so we need to scroll tab list left
                if (lis.eq(tab_index).is(':hidden')) {
                    var hidden_tabs = lis.filter(':hidden');
                    offset = -(hidden_tabs.size() - tab_index);
                } else {
                // Check if we need to scroll tab list right. The tab won't
                // be hidden in such case. To ensure the tab is hidden we'll
                // check that it's offsetTop is higher than the same thing
                // of the currently visible tab, i.e. the first visible
                    var lis_visible = lis.filter(':visible');
                    var sample_offsetTop = lis_visible[0].offsetTop;
                    if (lis[tab_index].offsetTop > sample_offsetTop) {
                    // Tab is really invisible, let's calc how far away it is
                        offset = 0;
                        lis_visible.each(function() {
                            // If the tab is invisible, we need to scroll it
                            if (this.offsetTop > sample_offsetTop) {
                                offset++;
                            }
                            // But don't scroll after the tab we need to show
                            if (this == lis[tab_index]) {
                                return false;
                            }
                        });
                    }
                }
                // Do actual scrolling if it's needed
                if (offset !== undefined) {
                    habahaba.view.tab_scroll(offset, true);
                }

                // Activate tab and update chatstate for the contact
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
            },
            check_tabs_scrollstate: function() {
                // Check if tab bar needs to have scroll buttons
                // To do so, we'll need temporary show hidden tabs
                // to calculate sizes properly. Then we can hide them back.
                var panel = document.getElementById('tabs'),
                    $hidden = $('li:hidden', panel);
                var state = new Model('.view.tabs_state').get();
                $hidden.show();
                state.scrolling = panel.scrollHeight > panel.clientHeight;
                // If we don't need any scrolling, move tab bar to a first tab
                if (!state.scrolling) {
                    state.position = 0;
                }
                $hidden.hide();
                state.set();
            },
            tab_scroll: function(offset, silently) {
                // Scroll tab bar for some number of tabs
                var state = new Model('.view.tabs_state').get(),
                    position = state.position,
                    tabs_count = new Model('.view.tabs').getCollection().length,
                    panel = document.getElementById('tabs');
                position += offset;
                // Check that we won't quit the borders
                if (position < 0) {
                    position = 0;
                } else if (position > tabs_count - 1) {
                    position = tabs_count - 1;
                }
                state.position = position;
                // We'll need to update scrollable flag
                // To do this, we'll need to update visibility of tabs
                // accordingly
                if (offset != 0) {
                    $('li', panel).show();
                    var to_hide = $('li:visible:lt(' + position + ')', panel);
                    to_hide.hide();
                }
                state.scrollable_right = panel.scrollHeight >
                                            panel.clientHeight;
                state.set(silently);
            },
            tab_start_move: function(event) {
                is_tab_moving = true;
                var $this = $(this);
                tab_zindex = $this.css('z-index');
                $this.css('position', 'relative');
                $this.css('top', 0).css('left', 0);
                var _tab_zindex = parseInt(tab_zindex);
                if (!isNaN(_tab_zindex)) {
                    $this.css('z-index', _tab_zindex + 1);
                }
                tab_moving_pageX = event.pageX;
                tab_moving = new Model('.view.tabs').get(
                    $this.attr('data-tab-id')
                );
                left = 0;
            },
            tab_stop_move: function(event) {
                if (!is_tab_moving) {
                    return;
                }
                is_tab_moving = false;
                $(this).css('top', 0).css('left', 0).css('z-index', tab_zindex);
            },
            tab_move: function(event) {
                if (is_tab_moving) {
                    if (!tab_moving.active) {
                        habahaba.view.activate_tab(tab_moving.pk);
                        tab_moving.active = true;
                    }
                    left = left + event.pageX - tab_moving_pageX;
                    tab_moving_pageX = event.pageX;
                    var neighbor = undefined;
                    var $this = $(this);
                    $(this).css('left', left);
                    if (left > 0) {
                        neighbor = $this.next();
                    } else if (left < 0) {
                        neighbor = $this.prev();
                    }
                    if (neighbor && neighbor.size()) {
                        var neighbor_width = neighbor.outerWidth(true);
                        var treshold = (neighbor_width / 2);
                        if (Math.abs(left) > treshold) {
                            var lis = $('#tabs li');
                            var tab1 = new Model('.view.tabs').get(
                                    $this.attr('data-tab-id')
                                ),
                                tab2 = new Model('.view.tabs').get(
                                    neighbor.attr('data-tab-id')
                                );
                            left = -left;
                            $this.css('left', left);
                            var o1 = tab1.order;
                            tab1.order = tab2.order;
                            tab2.order = o1;
                            tab1.set(true);
                            tab2.set();
                            //$this.insertAfter(neighbor);
                        }
                    }
                }
            }
        }

        var is_tab_moving = false,
            tab_moving = undefined,
            tab_moving_pageX,
            tab_zindex,
            left;

        $(window).resize(function() {
            habahaba.view.check_tabs_scrollstate();
            habahaba.view.tab_scroll(0);
        });

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

                // We want also to expand the group if the tab was not opened
                if (!tab && roster_item.groups.length) {
                    habahaba.view.collapse_group(roster_item.groups[0]);
                }
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
