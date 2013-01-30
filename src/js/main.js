"use strict";
var habahaba = {};
window.habahaba = habahaba;

habahaba.view_start = function() {
    var data = habahaba.client.data;
    data['__main__'] = {

    }
    var _modelEngine = modelEngine(data);
    var dispatcher = _modelEngine.dispatcher;
    var Model = _modelEngine.Model;

    dispatcher.bind('world:changed', function() {
        var rendered = dispatcher.render(new Model('__main__'));
        $('body').html(rendered);
    });

    dispatcher.start();
    window.Model = Model;
};

yr.externals.count = function(nodeset) {
    return nodeset.length;
}

yr.externals.max_priority = function(nodes) {
    var values = {};
    var avalues = [];
    for (var i=0, l=nodes.length; i<l; i++) {
        var node = nodes[i];
        var value = node.data.priority;
        values[value] = node;
        if (value !== undefined && node.data.type != 'unavailable')
            avalues.push(value);
    }
    if (avalues.length) {
        var max = Math.max(avalues);
        return [values[max]];
    } else if (undefined in values) {
        return [values[undefined]]
    }
    return [];
}
