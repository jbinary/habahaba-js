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

data.existent1 = '\
<div id="group-list-5">\
    <div id="contact-5-142"></div>\
    <div id="contact-5-98"></div>\
    <div id="contact-5-197"></div>\
    <div id="contact-5-110"></div>\
    <div id="contact-5-13"></div>\
    <div id="contact-5-84"></div>\
    <div id="contact-5-218"></div>\
</div>';
data.rendered1 = '\
<div id="group-list-5">\
    <div id="contact-5-98"></div>\
    <div id="contact-5-197"></div>\
    <div id="contact-5-110"></div>\
    <div id="contact-5-13"></div>\
    <div id="contact-5-84"></div>\
    <div id="contact-5-218"></div>\
</div>';

data.existent2 = '\
<div id="group-list-0">\
<div id="contact-0-250"></div>\
<div id="contact-0-26"></div>\
<div id="contact-0-191"></div>\
<div id="contact-0-252"></div>\
<div id="contact-0-14"></div>\
<div id="contact-0-237" data-removed="true"></div>\
<div id="contact-0-32"></div>\
<div id="contact-0-181"></div>\
<div id="contact-0-28"></div>\
</div>';
data.rendered2 = '\
<div id="group-list-0">\
<div id="contact-0-250"></div>\
<div id="contact-0-26"></div>\
<div id="contact-0-191"></div>\
<div id="contact-0-252"></div>\
<div id="contact-0-14"></div>\
<div id="contact-0-237"></div>\
<div id="contact-0-32"></div>\
<div id="contact-0-181"></div>\
<div id="contact-0-28"></div>\
</div>';

data.existent3 = '\
<div id="group-list-5">\
    <div id="contact-5-19"></div>\
    <div id="contact-5-8"></div>\
    <div id="contact-5-247"></div>\
    <div id="contact-5-23"></div>\
</div>';
data.rendered3 = '\
<div id="group-list-5">\
    <div id="contact-5-122"></div>\
    <div id="contact-5-8"></div>\
    <div id="contact-5-177"></div>\
    <div id="contact-5-29"></div>\
    <div id="contact-5-151"></div>\
    <div id="contact-5-93"></div>\
    <div id="contact-5-23"></div>\
</div>';

data.existent4 = '\
<div id="group-list-12">\
<div id="contact-12-98" data-removed="true" style="smth important">\
<div class="avatar"></div>\
<span class="away"></span>\
<h5>fake@gmail.com</h5>\
<p></p>\
</div>\
</div>';
data.rendered4 = '\
<div id="group-list-12">\
<div class="avatar"></div>\
<span class="dnd"></span>\
<h5>fake@gmail.com</h5>\
<p></p>\
</div>';

var PatcherTest = buster.testCase("PatcherTest", {
    setUp: function() {
        this._genericPatcherTest = function(existent, rendered) {
            assert(existent != rendered);
            var wrapper = document.implementation.createHTMLDocument('');
            wrapper.body.innerHTML = rendered;
            rendered = wrapper.body.firstChild;

            var wrapper = document.implementation.createHTMLDocument('');
            wrapper.body.innerHTML = existent;
            existent = wrapper.body.firstChild;

            var rendered = rendered,
                existent = existent;
            habahaba._patch(rendered, existent);
            assert(!DOMdiff.getDiff(rendered, existent)[0]);
        }
    },
    testGoneToOffline: function() {
        this._genericPatcherTest(data.existent, data.rendered);
    },
    testGoneToOffline1: function() {
        this._genericPatcherTest(data.existent1, data.rendered1);
    },
    testAppearOnline: function() {
        this._genericPatcherTest(data.existent2, data.rendered2);
    },
    testSearch: function() {
        this._genericPatcherTest(data.existent3, data.rendered3);
    },
    testContactOfflineThenOnlineWithAnotherStatus: function() {
        this._genericPatcherTest(data.existent4, data.rendered4);
    }
});
