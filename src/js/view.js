"use strict";
(function() {
    var roster_search_timer, Model, dispatcher, fields = {};
    var plugin = function(jslix_dispatcher, data, storage, account_storage) {
        this.account_storage = account_storage;
        var that = this;
        habahaba.view = {
            setup_dialog_block: function() {
                var $this = $(this);
                $this.scroll(function() {
                    var prevent_auto_scroll = 
                        $this.scrollTop() + $this.height() != $this.prop('scrollHeight');
                    var tab = new Model('.view.tabs').get($this.attr('data-tab'));
                    tab.prevent_auto_scroll = prevent_auto_scroll;
                    tab.set();
                });
                var roster_item = $this.attr('data-rosteritem');
                var roster_item = new Model('.roster.items').get(roster_item);
                habahaba.view.autoscroll(roster_item);
            },
            roster_search: function() {
                // We don't want to search too often because it can hurt
                // the performance
                if (roster_search_timer) {
                    return;
                }
                roster_search_timer = setTimeout(function() {
                    roster_search_timer = undefined;
                    var settings = new Model('.view.roster_settings').get();
                    settings.search_string = $('div#search input').val();
                    settings.set();
                }, 250);
            },
            collapse_all_groups: function() {
                var groups = new Model('.roster.groups').getAll().filter(
                    function(group) { return !group.hidden }),
                    roster_settings = new Model('.view.roster_settings').get();
                if (groups.length <= roster_settings.collapsed_groups.length) {
                    roster_settings.collapsed_groups.length = 0;
                } else {
                    $.each(groups, function() {
                        roster_settings.collapsed_groups.push(this.name);
                    });
                }
                roster_settings.set();
            },
            collapse_group: function(gpk, flags) {
                var group = new Model('.roster.groups').get(gpk);
                if (!group) return;
                flags = flags || {};
                var roster_settings = new Model('.view.roster_settings').get(),
                    collapsedGroup = roster_settings.collapsed_groups,
                    groupName = group.name,
                    groupIndex = collapsedGroup.indexOf(groupName),
                    groupIsThere = groupIndex > -1;
                if (!groupIsThere && !flags.only_expand) {
                    roster_settings.collapsed_groups.push(groupName);
                } else if (groupIsThere && !flags.only_collapse) {
                    roster_settings.collapsed_groups.splice(groupIndex, 1);
                }
                roster_settings.set();
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
                data.loaded_plugins.messages.send_chat_message(text, contact);
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
            },
            toggle_hide_offline: function() {
                var roster_settings = new Model('.view.roster_settings').get();
                roster_settings.hide_offline_users = !roster_settings.hide_offline_users;
                roster_settings.set();
            }
        }

        var is_tab_moving = false,
            tab_moving = undefined,
            tab_moving_pageX,
            tab_zindex,
            left;

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

        yr.externals.contains = function(nodeset, scalar, case_insense) {
            var r = [];
            for (var i = 0; i < nodeset.length; i++) {
                var node = nodeset[i];
                var search_in = yr.nodeValue(node);
                if (case_insense) {
                    search_in = search_in.toLowerCase();
                    scalar = scalar.toLowerCase();
                }
                if (search_in.indexOf(scalar) > -1) {
                    r.push(node);
                }
            }
            return r;
        }

        yr.externals.icontains = function(nodeset, scalar) {
            return yr.externals.contains(nodeset, scalar, true);
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
    }

    fields.load = function() {
        // TODO: unload
        var that = this;
        $(window).resize(function() {
            habahaba.view.check_tabs_scrollstate();
            habahaba.view.tab_scroll(0);
        });

        var viewModel,
            data = habahaba.client.data;
        data['__main__'] = {}
        data.view = {
            tabs: [],
            tabs_state: [{
                pk: 'singleton',
                scrolling: false,
                position: 0,
                scrollable_right: true
            }],
            roster_settings: [{
                pk: 'singleton',
                hide_offline_users: true,
                collapsed_groups: [],
                search_string: ""
            }]
        }
        var _modelEngine = modelEngine(data);
        dispatcher = this.dispatcher = _modelEngine.dispatcher;
        Model = this.Model = _modelEngine.Model;

        dispatcher.bind('world:changed', function() {
            var rendered = dispatcher.render(new Model('__main__'));

            if ($('#wrapper').size() == 0) {
                $('body').html(rendered);
                DOM_patcher.apply_bubbledown_handler($('body')[0], 'oncreate');
                DOM_patcher.really_apply_handlers();
            } else {
                DOM_patcher.update_world(rendered);
            }
        });

        // Bind necessary signals handlers

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
                    habahaba.view.collapse_group(roster_item.groups[0], {
                                                    only_expand: true
                                                 });
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

        // Save view state across sessions
        var saves = {
            '.view.roster_settings': [
                'collapsed_groups',
                'hide_offline_users',
                'search_string'
            ]
        };
        $.each(saves, function(model_name, attrs) {
            var model = new Model(model_name).get();
            $.each(attrs, function(i, attr) {
                var storage = that.account_storage.path(model_name + '.' + attr);
                if (storage.exists()) {
                    model[attr] = storage.get();
                }
                dispatcher.bind('model:' + model_name +
                                ':attr-changed:' + attr, function(model) {
                    storage.set(model[attr]);
                });
            });
            model.set();
        });
        dispatcher.start();

        // Use transitions based animations if they are supported
        if ($.support.transition) {
            // Use transition-based slideUp and slideDown animations
            var styles = ['padding-top', 'padding-bottom', 'height'];
            var reset_styles = function(self, old_overflow) {
                self.css('overflow', old_overflow);
                $.each(styles, function(i, style) {
                    self.css(style, '');
                });
            }
            $.fn['slideUp'] = function(speed, easing, fn) {
                var self = this;
                // TODO: make it possible to use another queue or no queue
                this.queue(function(next) {
                    var old_overflow = self.css('overflow');
                    self.css('overflow', 'hidden');
                    var animate = {};
                    $.each(styles, function(i, style) {
                        animate[style] = 0;
                        self.css(style, self.css(style));
                    });
                    var cb_decorator = function(fn) {
                        return function() {
                            reset_styles(this, old_overflow);
                            this.hide();
                            fn.apply(this);
                        }
                    }
                    var args = {
                        speed: speed,
                        easing: easing,
                        fn: fn
                    }
                    // TODO: callback also could be passed as a "complete"
                    // option
                    $.each(args, function(key) {
                        if (typeof(this) == 'function') {
                            args[key] = cb_decorator(this);
                            return false;
                        } else if (key == 'fn') {
                            args[key] = cb_decorator(function() {});
                        }
                    });
                    self.transition(animate, args.speed, args.easing, args.fn);
                    next();
                });
            }
            $.fn['slideDown'] = function(speed, easing, fn) {
                var self = this;
                this.queue(function(next) {
                    var animate = {};
                    $.each(styles, function(i, style) {
                        self.css(style, '');
                        animate[style] = self.css(style);
                    });
                    var old_overflow = self.css('overflow');
                    self.css('overflow', 'hidden')
                    $.each(styles, function(i, style) {
                        self.css(style, 0);
                    });
                    self.show();
                    self.transition(animate, speed, easing, fn);
                    self.promise().done(function() {
                        reset_styles(self, old_overflow);
                    });
                    next();
                });
            }
        }
    }

    habahaba.Plugin({
            name: 'habahaba.desktop_view',
            provides: ['view',
                       'view.chatstates',
                       'view.roster',
                       'view.avatars']
        }, plugin, fields);
})();
