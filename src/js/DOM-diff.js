/**
 * Perform a difference check between two DOM elements
 *
 * (c) Mike "Pomax" Kamermans, but you can freely use it.
 */
var DOMdiff = (function() {

  var diffObject = {};

  /**
   * DOM element comparator.
   *
   * The fact that JavaScript doesn't have this
   * built into the DOM API is lamentable.
   *
   * return -1 if "plain" not equal,
   *         0 if equal,
   *        or a <number>[] representing the
   *        route in this element to a diff.
   *
   * FIXME: as long as the tagname stays the same, outerchange (class, etc) should be a modification, not top diff.
   *
   */
  var equal = function equal(e1, e2, after) {

    // first: if this element is a previous route's problem
    // point, we're going to TOTALLY ignore it and pretend it's
    // fine, so that we can find further problems.
    if (after) after = after.slice();
    var soffset = (after && after.length!==0 ? after.splice(0,1)[0] : 0);
    if(soffset === -1) {
      return 0;
    }

    // different element (1)?
    if(e1.nodeType !== e2.nodeType) {
      return -1;
    }

    // shortcut handling for text?
    if(e1.nodeType===3 && e2.nodeType===3) {
      if(e1.textContent.trim() != e2.textContent.trim()) {
        return -1;
      }
      return 0;
    }

    // different element (2)?
    if(e1.nodeName.toLowerCase() !== e2.nodeName.toLowerCase()) {
      return -1;
    }

    // different content?
    /*var l1 = $(e1).children().not('*[removed]').size();
    var l2 = $(e2).children().not('*[removed]').size();*/

    var count_children = function(node) {
        var l = 0;
        for (var i=0; i<node.childNodes.length; i++) {
            var child = node.childNodes[i];
            if (!(child.hasAttribute && child.hasAttribute('removed'))) l++;
        }
        return l;
    }

    var l1 = count_children(e1),
        l2 = count_children(e2);
    if(l1 != l2) {
      return -1;
    }

    // different attributes?
    var attrs = ["id",     // ids MUST be identical, nice and simple
                 //"style",  // this one's tricky, and I don't want to write a full CSS parser right now. FIXME: later
                 "class",  // this one's less tricky, but still requires split/sort comparison. FIXME: later
                 "type",
                 "value",
                 "href",
                 "src",
                 "rel",
                 "__more__attributes__here__"],
        a, last = attrs.length,
        attr, a1, a2;

    for(a=0; a<last; a++) {
      attr = attrs[a];
      a1 = e1.getAttribute(attr);
      a2 = e2.getAttribute(attr);
      if(a1==a2 || (!a1 && a2=="") || (!a2 && a1=="")) continue;
      return -1;
    }

    // Different child node list?
    // Find where the first difference is
    var i1 = 0, last1 = e1.childNodes.length, eq, ret;
    var i2 = 0, last2 = e2.childNodes.length;
    while (i1 < last1 && i2 < last2) {
      // recurse to see if these children differ
      var node1 = e1.childNodes[i1];
      if (node1.hasAttribute && node1.hasAttribute('removed')) {
        i1++;
        continue;
      }
      var node2 = e2.childNodes[i2];
      if (node2.hasAttribute && node2.hasAttribute('removed')) {
        i2++;
        continue;
      }
      eq = equal(node1, node2, after);
      if(eq !== 0)
      {
        // (first) difference found. "eq" will indicate
        // which childNodes position the diff is found at.
        return [[i1, i2]].concat(eq);
      }
      i1++;
      i2++;
    }

    // nothing left to fail on - consider
    // these two elements equal.
    return 0;
  };

  diffObject.equal = equal;

  var getDiff = function getDiff(e1, e2) {
    var route = equal(e1,e2),
        routes = [route],
        newRoute;

    while(typeof route === "object") {
      newRoute = equal(e1,e2,route.slice());
      routes.push(newRoute);
      route = newRoute;
    }

    // Remove "0" from routes if length > 1, since
    // the last attempt will find no differences, but
    // will do so because it's "deemed safe".
    if(routes.length>1) { routes.splice(routes.indexOf(0), 1); }
    return routes;
  };
  diffObject.getDiff = getDiff;

  return diffObject;
}());
