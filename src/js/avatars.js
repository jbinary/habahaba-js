/*
 * Habahaba vcard based avatars implementation (XEP-0153)
 * Requires jslix.vcard and CryptoJS.SHA1
 *
 */

"use strict";
(function(){
    var habahaba = window.habahaba;
    var jslix = window.jslix;
    var WrongElement = jslix.exceptions.WrongElement;

    var presence = jslix.Element({
        clean_type: function(value) {
            if (value) throw new WrongElement();
            return value;
        }
    }, [jslix.stanzas.PresenceStanza]);

    var plugin = function(dispatcher, data, storage, account_storage) {
        this.dispatcher = dispatcher;
        this.vcard = new jslix.VCard(this.dispatcher);
        this.storage = account_storage;
        this.roster = data.loaded_plugins.roster;
    }

    var fields = {};
    fields.load = function() {
        this.dispatcher.addHandler(this.update_request, this,
                                   'habahaba.avatars');
        this.avatars_available = this.storage.path('avatars_available');
        if (!this.avatars_available.exists()) {
            this.avatars_available.set([]);
        }
        var avatars_available = this.avatars_available.get();
        this.roster.signals.got.add(function () {
            for (var i=0; i<avatars_available.length; i++) {
                var jid = avatars_available[i];
                var hash = this.storage.path(jid, 'hash').get();
                this.update_avatar_availability(jid, hash, true);
            }
        }, this);
    }

    fields.unload = function() {
        this.dispatcher.unregisterPlugin(this);
        // XXX TODO: don't listen to any signals anymore
    }

    fields.update_request = jslix.Element({
        parent_element: presence,
        element_name: 'x',
        xmlns: 'vcard-temp:x:update',
        photo: new jslix.fields.StringNode('photo'),

        clean_photo: function(value) {
            if (value === undefined) {
                throw new jslix.exceptions.WrongElement('Photo is undefined');
            }
            return value;
        },

        anyHandler: function(update, top) {
            var _remove_avatar_but_not_hash = function() {
                type.del();
                binval.del();
                var avatars_available = self.avatars_available.get();
                var i = avatars_available.indexOf(jid);
                if (i != -1) {
                    avatars_available.splice(i, 1);
                    self.avatars_available.set(avatars_available);
                    self.update_avatar_availability(jid, false);
                    hash.exists() && self._removeCSSClass(hash.get());
                }
            }

            var jid = top.from.getBareJID();
            var storage = this.storage.chroot(jid);
            var hash = storage.path('hash');
            var self = this;
            var binval = storage.path('binval');
            if (!hash.exists() || hash.get() != update.photo) {
                var type = storage.path('type');
                this.vcard.get(jid).done(function(result) {
                    if (result.photo && result.photo.binval && update.photo) {
                        var _binval = result.photo.binval.replace(/[^a-z0-9+/=]/gi, '');
                        var raw_length = _binval.length * 3 / 4;
                        if (raw_length <= 32 * 1024) { // TODO: setting
                            var raw_photo = CryptoJS.enc.Base64.parse(_binval);
                            var comp_hash = CryptoJS.SHA1(raw_photo);
                            comp_hash = CryptoJS.enc.Hex.stringify(comp_hash);
                            if (comp_hash == update.photo) {
                                hash.set(comp_hash);
                                type.set(result.photo.type);
                                binval.set(result.photo.binval);
                                var avatars_available = self.avatars_available.get();
                                if (avatars_available.indexOf(jid) == -1) {
                                    avatars_available.push(jid);
                                    self.avatars_available.set(avatars_available);
                                }
                                self.update_avatar_availability(jid, comp_hash);
                            }
                        } else {
                            hash.set(update.photo);
                            _remove_avatar_but_not_hash();
                        }
                    } else if (!update.photo &&
                                (!result.photo || !result.photo.binval)) {
                        hash.del();
                        _remove_avatar_but_not_hash();
                    }
                }).fail(function(failure) {
                    // If we have failed to fetch vcard but there is no
                    // any avatar announced then we won't want to fetch it
                    // again, huh?
                    if (!update.photo ||
                      failure instanceof jslix.exceptions.ElementParseError) {
                        hash.set(update.photo);
                        _remove_avatar_but_not_hash();
                    }
                });
            } else if (hash.exists() && binval.exists()) {
                self.update_avatar_availability(jid, hash.get());
            }
        }
    });

    fields._createCSSClass = function(selector, style) {
        var id = 'injected-style-' + selector;
        if (!document.getElementById(id)) {
            var style_el = document.createElement('style');
            style_el.id = id;
            style_el.type = 'text/css';
            style_el.innerHTML = selector + ' { ' + style + ' }';
            document.getElementsByTagName('head')[0].appendChild(style_el);
        }
    }

    fields._removeCSSClass = function(selector) {
        var style = document.getElementById('injected-style-' + selector);
        if (style) {
            style.parentElement.removeChild(style);
        }
    }

    fields.get_avatar_uri = function(roster_item) {
        var result;
        if (roster_item && roster_item.avatar_hash) {
            var storage = this.storage.chroot(roster_item.jid.getBareJID());
            var type = storage.path('type').get();
            var binval = storage.path('binval').get();
            binval = binval.replace(/[^a-z0-9+/=]/gi, '');
            result = 'data:';
            if (type) result += type;
            result += ';base64,' + binval;
        }
        return result;
    }

    fields.update_avatar_availability = function(jid, hash, silently) {
        var item = this.roster.get_roster_item(jid);
        if (item) {
            if (hash) {
                item.avatar_hash = hash;
                var avatar_uri = this.get_avatar_uri(item);
                if (avatar_uri) {
                    this._createCSSClass('div.avatar.hash-' + hash,
                                'background-image: url(' + avatar_uri + ')');
                }
            } else if (item.avatar_hash) {
                delete item.avatar_hash;
            }
            item.set(silently);
        }
    }

    habahaba.Plugin(
        {
            name: 'avatars',
            weak_dependecies: ['vcard'],
            depends: ['view.avatars', 'roster']
        },
        plugin,
        fields
    );
})();
