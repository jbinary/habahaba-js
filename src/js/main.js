"use strict";
(function() {
    var habahaba = {};
    window.habahaba = habahaba;

    var viewModel;
    habahaba.view_start = function() {
        var data = habahaba.client.data;
        data['__main__'] = {}
        data.view = [{
            pk: 'singleton',
            collapsed_groups: []
        }]
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
    var handler;
    try {
        handler = new Function(node.getAttribute(event_name));
    } catch (e) {} // TODO: logging?
    return handler;
}

var update_world = function(rendered) {
    var replace = function(child) {
        var work_el = child;
        while (!work_el.getAttribute || 
                !work_el.getAttribute('id')) {
            work_el = work_el.parentElement;
        }
        var id = work_el.getAttribute('id');
        var new_el = wrapper.getElementById(id);
        if (new_el) {
            $(work_el).replaceWith($(new_el).clone());
            return true;
        }
    }

    var wrapper = document.implementation.createHTMLDocument();
    wrapper.body.innerHTML = rendered;
    rendered = wrapper.body;

    var d1 = rendered.firstChild,
        d2 = $('body')[0].firstChild;
    while (true) {
        var path = DOMdiff.equal(d1, d2);
        if (!path) break;
        var e1 = d1, e2 = d2;
        for (var p=0; p<path.length - 1; p++) {
            var c = path[p];
            var e1 = e1.childNodes[c[0]];
            var e2 = e2.childNodes[c[1]];
        }
        if (e1.childNodes.length == e2.childNodes.length && 
            e1.childNodes.length == 0) {
            $(e2).replaceWith($(e1).clone());
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
            continue;
        }

        for (var c=0, len=e1.childNodes.length; c<len; c++) {
            var child = e1.childNodes[c];
            var _child = e2.childNodes[c];
            if (_child) {
                if (_child.hasAttribute('removed')) {
                    $(_child).stop(true, true);
                    $(_child).show();
                    _child.removeAttribute('removed');
                }
                var _p = DOMdiff.equal(child, _child);
                if (_p === 0) continue;
            }
            var id = child.getAttribute('id');
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
                var prev, next = undefined;
                if (len != 1 && c>0) {
                    prev = e1.childNodes[c-1].getAttribute('id');
                    prev = document.getElementById(prev);
                } else if (len != 1 && c<len-1) {
                    next = e1.childNodes[c+1].getAttribute('id');
                    next = document.getElementById(next);
                }
                if (!next && !prev) {
                    var showed = e2.appendChild(cloned);
                } else if (next) {
                    var showed = $(cloned).insertBefore($(next));
                } else {
                    var showed = $(cloned).insertAfter($(prev));
                }
                var handler = get_event_handler(cloned, 'onshow');
                if (handler) {
                    handler.apply(cloned);
                }
            } else {
                console.log('Something went wrong');
                break;
            }
        }
        for (var c=0, len=e2.childNodes.length; c<len; c++) {
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
                var handler = get_event_handler(child, 'onhide');
                if (handler) handler.apply(child);

                $(child).promise().done(function() {
                    if (this[0].hasAttribute('removed')) {
                        try {
                            this[0].parentElement.removeChild(this[0]);
                        } catch (e) {}
                    }
                });
            }
        }
    }
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

    var getViewModel = function() {
        return new Model('.view').get();
    }

    habahaba.view = {
        collapse_group: function(gpk) {
            var viewModel = getViewModel();
            var index = viewModel.collapsed_groups.indexOf(gpk);
            if (index == -1) {
                viewModel.collapsed_groups.push(gpk);
            } else {
                var cgroups = viewModel.collapsed_groups;
                var res = cgroups.slice(0, index);
                res = res.concat(cgroups.slice(index + 1));
                viewModel.collapsed_groups = res;
            }
            viewModel.set();
        }
    }

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
})();
