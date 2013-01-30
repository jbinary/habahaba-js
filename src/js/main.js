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
