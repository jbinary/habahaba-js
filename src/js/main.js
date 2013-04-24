"use strict";
(function() {
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
            }]
        }
        var _modelEngine = modelEngine(data);
        var dispatcher = _modelEngine.dispatcher;
        var Model = _modelEngine.Model;

        var _moveNode = function(parent, node, i) {
            if (i == parent.childNodes.length - 1) {
                parent.appendChild(node);
            } else {
                parent.insertBefore(node, parent.childNodes[i+1]);
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
                var cloned = el.cloneNode(true);
                parent.appendChild(cloned);
                restore_preserved_attrs(cloned);
                apply_event_handler(cloned, 'onshow');
                apply_bubbledown_handler(cloned, 'oncreate');
            }

            var zzz = 0;
            while (true) {
                zzz++;
                if (zzz > 30) debugger; // XXX: we can avoid this infinite loop
                                        // by checking if elements are changed
                                        // internally when reallocate them
                                        // in the DOM tree
                var paths = DOMdiff.getDiff(rendered, existent);
                if (!paths[0]) break;
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
                for (var pi=0; pi<paths.length; pi++) {
                    var e1 = paths[pi][0],
                        e2 = paths[pi][1],
                        id1 = getAttribute(e1, 'id'),
                        id2 = getAttribute(e2, 'id');

                    if (e1.fake) {
                        // TODO: check if it just was moved?
                        removeElement(e2);
                        continue;
                    } else if (e2.fake) {
                        appendElement(e2.parentElement, e1);
                        continue;
                    } else if (id1 == id2) {
                        check_attributes();
                        if (id1 && id2) {
                            patch(e1, e2);
                        } else {
                            replaceWith(e1, e2);
                        }
                        continue;
                    // Check if two elements were swapped under the same parent
                    } else if (id1 && id2 && id1 != id2) {
                        var _e1 = document.getElementById(id1);
                        if (!_e1) {
                            appendElement(e2.parentNode, e1);
                        }
                        var _e2 = e1.ownerDocument.getElementById(id2);
                        if (!_e2) {
                            removeElement(e2);
                            continue;
                        }
                        var i1 = $(e1.parentElement).children().index($(e1));
                        var i2 = $(e1.parentElement).children().index($(_e2));
                        if (i1 >= 0 && i2 >= 0 && _e1 && _e2) {
                            // Indexes were swapped and both are actually exist
                            // They are actually swapped!
                            var parent = e2.parentElement;
                            _moveNode(parent, _e1, i1);
                            _moveNode(parent, e2, i2);
                            continue;
                        }
                        if (!_e1) continue;
                    }
                    console.log('Something went wrong');
                    debugger;
                    return;
                }
            }
        }

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
