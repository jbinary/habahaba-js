"use strict";
(function() {
    var habahaba = {
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
            tabs: []
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
    handler.apply(node);
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
    $(node).parent().find('*[data-preserve][id]').each(function() {
        var attrs = $(this).attr('data-preserve').split(',');
        var that = this;
        $.each(attrs, function(_i, attr) {
            if (preserves[that.id] && preserves[that.id][attr]) {
                that[attr] = preserves[that.id][attr];
                delete preserves[that.id][attr];
            }
        });
    });
}

var really_apply_handlers = function() {
    $.each(handlers, function() {
        this.func.apply(null, this.args);
    });
}

var preserves = {};
var handlers;

var update_world = function(rendered) {
    handlers = [];
    var replaceWith = function(with_, what) {
        var new_child = with_.cloneNode(true);
        what.parentElement.replaceChild(new_child, what);
    }

    var replace = function(child) {
        var work_el = child;
        while (!work_el.getAttribute || 
                !work_el.getAttribute('id')) {
            work_el = work_el.parentElement;
        }
        var id = work_el.getAttribute('id');
        work_el = document.getElementById(id);
        var new_el = wrapper.getElementById(id);
        if (new_el) {
            work_el.innerHTML = '';
            $.each(new_el.childNodes, function() {
                var cloned = this.cloneNode(true);
                work_el.appendChild(cloned);
                restore_preserved_attrs(cloned);
                apply_bubbledown_handler(cloned, 'oncreate');
            });
            return true;
        }
    }

    var check_attributes = function() {
        // Check attributes
        if (!e1.attributes || !e2.attributes) return;
        // Are there any new attributes?
        var id_changed = false;
        for (var a=0, len=e1.attributes.length; a<len; a++) {
            var attr = e1.attributes[a];
            var _attr = e2.attributes.getNamedItem(attr.name);
            if (!_attr || _attr.nodeValue != attr.nodeValue) {
                var _attr = document.createAttribute(attr.name);
                _attr.nodeValue = attr.nodeValue;
                e2.attributes.setNamedItem(_attr);
                if (attr.name === 'id')  {
                    id_changed = true;
                }
            }
        }
        // Are there any obsolete attributes?
        for (var a=e2.attributes.length-1; a>=0; a--) {
            var attr = e2.attributes[a];
            if (!e1.attributes.getNamedItem(attr.name)) {
                e2.attributes.removeNamedItem(attr.name);
            }
        }
        if (id_changed) {
            restore_preserved_attrs(e2.id);
            apply_bubbledown_handler(e2, 'oncreate');
        }
    }

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

    var d1 = rendered.firstChild,
        d2 = document.getElementsByTagName('body')[0].firstChild;
    var zzz = 0;
    while (true) {
        zzz++;
        if (zzz > 30) debugger; // XXX: we can avoid this infinite loop
                                // by checking if elements are changed
                                // internally when reallocate them
                                // in the DOM tree
        var paths = DOMdiff.getDiff(d1, d2);
        if (!paths[0]) break;
        for (var pi=0; pi<paths.length; pi++) {
            var path = paths[pi];
            if (!path) continue;
            var e1 = d1, e2 = d2;
            for (var p=0; p<path.length - 1; p++) {
                var c = path[p];
                var e1 = e1.childNodes[c[0]];
                var e2 = e2.childNodes[c[1]];
            }

            check_attributes();
            if (e1.childNodes.length == e2.childNodes.length && 
                e1.childNodes.length == 0) {
                replaceWith(e1, e2);
                continue;
            }

            // Check if two elements were swapped under the same parent
            var id1 = e1.getAttribute('id');
            var id2 = e2.getAttribute('id');
            if (id1 && id2 && id1 != id2) {
                var _e1 = document.getElementById(id1);
                var _e2 = wrapper.getElementById(id2);
                var i1 = $(e1.parentElement).children().index($(e1));
                var i2 = $(e1.parentElement).children().index($(_e2));
                if (i1 >= 0 && i2 >= 0) {
                    // They are actually swapped!
                    var parent = e2.parentElement;
                    _moveNode(parent, _e1, i1);
                    _moveNode(parent, e2, i2);
                }
            }

            for (var c=0, len=e1.childNodes.length; c<len; c++) {
                var child = e1.childNodes[c];
                var _child = e2.childNodes[c];
                if (_child) {
                    if (_child.hasAttribute && _child.hasAttribute('removed')) {
                        $(_child).stop(true, true);
                        $(_child).show();
                        _child.removeAttribute('removed');
                    }
                    var _p = DOMdiff.equal(child, _child);
                    if (_p === 0) continue;
                }
                var id;
                if (child.getAttribute)
                    id = child.getAttribute('id');
                if (!id) {
                    replace(child);
                    break;
                }
                var old_el = document.getElementById(id);
                if (old_el && old_el.parent != e2) {
                    // Move TODO
                } else if (!old_el) {
                    // Add
                    var cloned = child.cloneNode(true);
                    var next = undefined;
                    if (len != 1 && c<len-1) {
                        next = e1.childNodes[c+1].getAttribute('id');
                        next = document.getElementById(next);
                    }
                    if (!next) {
                        var showed = e2.appendChild(cloned);
                    } else {
                        next.parentElement.insertBefore(cloned, next);
                    }
                    restore_preserved_attrs(cloned);
                    apply_event_handler(cloned, 'onshow');
                    apply_bubbledown_handler(cloned, 'oncreate');
                } else {
                    console.log('Something went wrong');
                    break;
                }
            }
            for (var len=e2.childNodes.length - 1, c=len; c>=0; c--) {
                var child = e2.childNodes[c];
                var _child = e1.childNodes[c];
                if (_child) {
                    var _p = DOMdiff.equal(child, _child);
                    if (_p === 0) continue;
                }
                var f = replace(child);
                // TODO: optimisation: don't look through elements
                // that were processed in the previous loop
                if (!f) {
                    // Remove
                    child.setAttribute('removed', true);
                    apply_event_handler(child, 'onhide');
                    push_handler(function(child) {
                        $(child).promise().done(function() {
                            if (this[0].hasAttribute('removed')) {
                                try {
                                    this[0].parentElement.removeChild(this[0]);
                                } catch (e) {}
                            }
                        });
                    }, [child]);
                }
            }
        }
    }
    really_apply_handlers();
}

dispatcher.bind('world:changed', function() {
    var rendered = dispatcher.render(new Model('__main__'));

    if ($('#wrapper').size() == 0) {
        $('body').html(rendered);
    } else {
        update_world(rendered);
    }
});

        dispatcher.start();
        window.Model = Model;
    }
})();
