debug_tools = {
    getIDs: function(el) {
        var r = [];
        for (var i=0; i<el.childNodes.length; i++) {
            r.push(el.childNodes[i].id + ' ' +  el.childNodes[i].getAttribute('data-removed'))
        }
        return r;
    },
    getElementById: function(parent, tagname, id) {
        var els = parent.getElementsByTagName(tagname);
        for (var i = 0; i<els.length; i++) {
            if (els[i].id == id) {
                return els[i];
            }
        }
    }
}
