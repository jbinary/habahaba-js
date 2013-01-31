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
            collapsed_groups: [1]
        }]
        var _modelEngine = modelEngine(data);
        var dispatcher = _modelEngine.dispatcher;
        var Model = _modelEngine.Model;

        dispatcher.bind('world:changed', function() {
            var rendered = dispatcher.render(new Model('__main__'));
            $('body').html(rendered);
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
