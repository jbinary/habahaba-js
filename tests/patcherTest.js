var data = {};
data.existent = '\
<div id="group-list-0">\
    <div id="contact-0-12"></div>\
    <div id="contact-0-251"></div>\
    <div id="contact-0-236"></div>\
    <div id="contact-0-25"></div>\
    <div id="contact-0-26"></div>\
    <div id="contact-0-30"></div>\
    <div id="contact-0-16"></div>\
    <div id="contact-0-179"></div>\
    <div id="contact-0-189"></div>\
    <div id="contact-0-249"></div>\
    <div id="contact-0-75"></div>\
    <div id="contact-0-24"></div>\
</div>';
data.rendered = '\
<div id="group-list-0">\
    <div id="contact-0-30"></div>\
    <div id="contact-0-12"></div>\
    <div id="contact-0-236"></div>\
    <div id="contact-0-25"></div>\
    <div id="contact-0-26"></div>\
    <div id="contact-0-16"></div>\
    <div id="contact-0-179"></div>\
    <div id="contact-0-189"></div>\
    <div id="contact-0-251"></div>\
    <div id="contact-0-249"></div>\
    <div id="contact-0-24"></div>\
</div>';
var PatcherTest = buster.testCase("PatcherTest", {
    setUp: function() {

    },
    testGoneToOffline: function() {
        assert(data.existent);
        assert(data.rendered);
        var existent = data.existent;
        var rendered = data.rendered;
        assert(existent != rendered);
        var wrapper = document.implementation.createHTMLDocument('');
        wrapper.body.innerHTML = rendered;
        rendered = wrapper.getElementById('group-list-0');

        var wrapper = document.implementation.createHTMLDocument('');
        wrapper.body.innerHTML = existent;
        existent = wrapper.getElementById('group-list-0');

        var rendered = rendered,
            existent = existent;
        debugger;
        habahaba._patch(rendered, existent);
        assert(!DOMdiff.getDiff(rendered, existent)[0]);
    }
});
