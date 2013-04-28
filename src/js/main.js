"use strict";
(function() {
    var _moveNode = function(parent, node, i) {
        parent.removeChild(node);
        if (i == parent.childNodes.length) {
            parent.appendChild(node);
        } else {
            parent.insertBefore(node, parent.childNodes[i]);
        }
    }

    var get_event_handler = function(node, event_name) {
        if (!node.getAttribute) return;
        var handler = node.getAttribute(event_name);
        if (handler) {
            handler = new Function(handler);
            try {
                node.removeAttribute(event_name);
            } catch (e) {} // TODO: logging?
        }
        return handler;
    }

    var push_handler = function(func, args) {
        handlers.push({
            func: func,
            args: args
        });
    }

    var apply_event_handler = function(node, event_name) {
        push_handler(_apply_event_handler, arguments);
    }

    var apply_bubbledown_handler = function(node, event_name) {
        push_handler(_apply_bubbledown_handler, arguments);
    }

    var restore_preserved_attrs = function(node) {
        push_handler(_restore_preserved_attrs, arguments);
    }

    var _apply_event_handler = function(node, event_name) {
        var handler = get_event_handler(node, event_name);
        if (!handler) return;
        try {
            handler.apply(node);
        } catch(e) {
            console.log('Event', event_name, 'on node', node, 'has failed',
                        e, e.stack);
        }
    }

    var _apply_bubbledown_handler = function(node, event_name) {
        _apply_event_handler(node, event_name);
        $('*['+ event_name +']', node).each(function() {
            _apply_event_handler(this, event_name);
        });
    }

    var _restore_preserved_attrs = function(node) {
        if (typeof(node) === 'string') {
            node = document.getElementById(node);
        }
        $(node).parent().find('*[data-preserve][id]').not('[removed]').each(
            function() {
                var attrs = $(this).attr('data-preserve').split(',');
                var that = this;
                $.each(attrs, function(_i, attr) {
                    if (preserves[that.id] &&
                        preserves[that.id][attr] !== undefined) {
                        that[attr] = preserves[that.id][attr];
                        delete preserves[that.id][attr];
                    }
                });
            }
        );
    }

    var really_apply_handlers = function() {
        $.each(handlers, function() {
            this.func.apply(null, this.args);
        });
    }

    var preserves = {};
    var handlers = [];

    var update_world = function(rendered) {
        handlers = [];
        var wrapper = document.implementation.createHTMLDocument('');
        wrapper.body.innerHTML = rendered;
        rendered = wrapper.body;

        $('*[data-preserve][id]').each(function() {
            var attrs = $(this).attr('data-preserve').split(',');
            if (!preserves[this.id]) {
                preserves[this.id] = {};
            }
            var that = this;
            $.each(attrs, function(_i, attr) {
                preserves[that.id][attr] = that[attr];
            });
        });

        var rendered = rendered.firstChild,
            existent = document.getElementsByTagName('body')[0].firstChild;
        patch(rendered, existent);
        really_apply_handlers();
    }

    var patch = function(rendered, existent) {
        var replaceWith = function(with_, what, parent) {
            var new_child = with_.cloneNode(true);
            what.parentElement.replaceChild(new_child, what);
        }

        var check_attributes = function() {
            // Check attributes
            if (!e1.attributes || !e2.attributes) return;
            // Are there any new attributes?
            for (var a=0, len=e1.attributes.length; a<len; a++) {
                var attr = e1.attributes[a];
                var _attr = e2.attributes.getNamedItem(attr.name);
                if (!_attr || _attr.nodeValue != attr.nodeValue) {
                    var _attr = document.createAttribute(attr.name);
                    _attr.nodeValue = attr.nodeValue;
                    e2.attributes.setNamedItem(_attr);
                }
            }
            // Are there any obsolete attributes?
            for (var a=e2.attributes.length-1; a>=0; a--) {
                var attr = e2.attributes[a];
                if (['removed', 'style'].indexOf(attr.name) > -1) continue;
                if (!e1.attributes.getNamedItem(attr.name)) {
                    e2.attributes.removeNamedItem(attr.name);
                }
            }
        }

        var getAttribute = function(el, name) {
            if (!el || !el.getAttribute) return null;
            return el.getAttribute(name);
        }

        var getChild = function(el, i) {
            if (el.childNodes[i]) return el.childNodes[i];
            return {
                'parentElement': el,
                'parentNode': el,
                'fake': true
            }
        }

        var removeElement = function(el) {
            var id = getAttribute(el, 'id');
            var exist = rendered.ownerDocument.getElementById(id);
            if (exist) {
                return exist;
            }
            if (el.setAttribute) {
                // Remove
                el.setAttribute('removed', true);
                apply_event_handler(el, 'onhide');
                push_handler(function(el) {
                    $(el).promise().done(function() {
                        if (this[0].hasAttribute('removed')) {
                            try {
                                this[0].parentElement.removeChild(this[0]);
                                _apply_event_handler(this[0], 'onremove');
                            } catch (e) {}
                        }
                    });
                }, [el]);
            } else {
                el.parentNode.removeChild(el);
            }
        }

        var appendElement = function(parent, el) {
            var id = getAttribute(el, 'id'),
                exist = id && parent.ownerDocument.getElementById(id),
                removed = exist && exist.getAttribute('removed'),
                cloned;
            if (exist && !removed) {
                return exist;
            } else if (exist && removed) {
                exist.removeAttribute('removed');
                // TODO: still need to think up how to start the show animation
                // after the stop animation has been stopped.
                $(exist).stop();
                cloned = exist;
            } else {
                cloned = el.cloneNode(true);
                parent.appendChild(cloned);
                restore_preserved_attrs(cloned);
                apply_bubbledown_handler(cloned, 'oncreate');
            }
            apply_event_handler(cloned, 'onshow');
            return cloned;
        }

        var get_new_index = function(parent, el) {
            var i = get_el_index(el),
                without_removed = Array.prototype.filter.call(parent.childNodes,
                function(e) { return !e.getAttribute ||
                                     !e.getAttribute('removed'); }),
                real_el = without_removed[i];
            return Array.prototype.indexOf.call(parent.childNodes, real_el);
        }

        var get_el_index = function(el) {
            var parent = el.parentElement;
            return Array.prototype.indexOf.call(parent.childNodes, el);
        }

        var convert_paths_to_elements = function(paths) {
            for (var pi=0; pi<paths.length; pi++) {
                var path = paths[pi];
                if (!path) continue;
                var e1 = rendered, e2 = existent;
                for (var p=0; p<path.length - 1; p++) {
                    var c = path[p];
                    var e1 = getChild(e1, c[0]);
                    var e2 = getChild(e2, c[1]);
                }
                paths[pi] = [e1, e2];
            }
        }

        var paths = DOMdiff.getDiff(rendered, existent);
        if (!paths[0]) {
            return;
        }
        convert_paths_to_elements(paths);
        for (var pi=0; pi<paths.length; pi++) {
            var e1 = paths[pi][0],
                e2 = paths[pi][1],
                id1 = getAttribute(e1, 'id'),
                id2 = getAttribute(e2, 'id'),
                parent = e2.parentElement;

            if (e1.fake) {
                // TODO: check if it just was moved?
                var _e2 = removeElement(e2);
                if (_e2) {
                    patch(_e2, e2);
                }
            } else if (e2.fake) {
                e2 = appendElement(parent, e1);
                var index = get_new_index(parent, e1);
                _moveNode(parent, e2, index);
            } else if (id1 == id2) {
                check_attributes();
                if (id1 && id2) {
                    patch(e1, e2);
                } else {
                    replaceWith(e1, e2);
                }
            // Check if two elements were swapped under the same parent
            } else if (id1 && id2 && id1 != id2) {
                var _e1 = document.getElementById(id1);
                if (!_e1) {
                    _e1 = appendElement(e2.parentNode, e1);
                }
                var _e2 = e1.ownerDocument.getElementById(id2);
                if (!_e2) {
                    removeElement(e2);
                }
                var index = get_new_index(parent, e1);
                if (index >= 0 && _e1) {
                    // They are actually swapped!
                    var _index = get_el_index(_e1),
                        _swap_with = parent.childNodes[index];
                    _moveNode(parent, _e1, index);
                    _moveNode(parent, _swap_with, _index);
                    patch(e1, _e1);
                    if (_e2) {
                        patch(_e2, e2);
                    }
                }
            } else {
                debugger;
                throw new Error('Something went wrong');
            }
        }
        // TODO: this check is only needed while debugging
        var path = DOMdiff.getDiff(rendered, existent);
        if (path[0]) {
            debugger;
            throw new Error('Something went wrong');
        }
    }

    var habahaba = {
        plugins: {},
        plugins_init_order: [], // TODO: dependency engine
        onlyFields: function(stanza) {
            var res = {};
            var definition = stanza.__definition__;
            for (var k in definition) {
                if (definition[k].field) {
                    var value = stanza[k];
                    if (value && value.__definition__)
                        res[k] = habahaba.onlyFields(value)
                    else
                        res[k] = value;
                }
            }
            return res;
        }
    };
    window.habahaba = habahaba;

    // TODO: don't do it if not in test
    habahaba._patch = patch;

    var viewModel;
    habahaba.view_start = function() {
        var data = habahaba.client.data;
        data['__main__'] = {}
        data.view = {
            collapsed_groups: [],
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
                search_string: ""
            }]
        }
        var _modelEngine = modelEngine(data);
        var dispatcher = _modelEngine.dispatcher;
        var Model = _modelEngine.Model;

        dispatcher.bind('world:changed', function() {
            var rendered = dispatcher.render(new Model('__main__'));

            if ($('#wrapper').size() == 0) {
                $('body').html(rendered);
                apply_bubbledown_handler($('body')[0], 'oncreate');
                really_apply_handlers();
            } else {
                update_world(rendered);
            }
        });

        dispatcher.start();
        window.Model = Model; // XXX: don't use window?
        return _modelEngine;
    }
})();
