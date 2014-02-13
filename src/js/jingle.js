"use strict";
require(['habahaba', 'jslix/jingle/jingle', 'models', 'jslix/jingle/adapter',
         'jslix/jingle/signals'],
        function(habahaba, Jingle, models, adapter, signals) {
    var Model = models.Model,
        RosterItem;

    habahaba.Plugin({
        name: 'jingle',
        weak_dependecies: ['disco'],
        depends: ['view.rtc', 'roster']
    },
    function(dispatcher, data) {
        this._dispatcher = dispatcher;
        this._data = data;
    },
    {
        load: function() {
            var that = this;
            var plugins = this._data.loaded_plugins;
            this.jingle = this._dispatcher.registerPlugin(
                Jingle,
                {
                    'disco_plugin': this._data.loaded_plugins.disco.disco,
                    'ice_config': {
                        "iceServers":[{
                            // TODO: use discovery
                            "url": "stun:stunserver.org"
                        }]
                    }
                }
            );
            this.jingle.init();
            RosterItem = plugins.roster.RosterItem;
            this.RTC = adapter.setupRTC();
            adapter.getUserMediaWithConstraints(this.RTC, ['audio', 'video']);
            signals.media.ready.add(function(stream) {
                that.jingle.localStream = stream;
                var sel = $('#jingle-myself-video')
                that.RTC.attachMediaStream(sel, stream);
                var state = new Model('.jingle.state').get();
                state.local_src = sel.attr('src');
                state.set();
            });
            this._data.jingle = {
                peer: [{'pk': 'singleton'}],
                state:[{'pk': 'singleton',
                        'fullscreen': false}],
            };
            signals.remote_stream.added.add(this.remote_stream_added.bind(this));
            signals.call.incoming.add(this.incoming_call.bind(this));
            signals.call.terminated.add(this.terminated_call.bind(this));
            signals.call.accepted.add(this.accepted_call.bind(this));
        },
        accepted_call: function(sid) {
            var state = new Model('.jingle.state').get();
            state.state = 'active';
            state.set();
        },
        terminated_call: function(sid) {
            var state = new Model('.jingle.state').get();
            if (!state.state) return false;
            delete state.state;
            state.set();
        },
        incoming_call: function(sid) {
            var state = new Model('.jingle.state').get(),
                session = this.jingle.sessions[sid];
            if (state.state) {
                session.sendTerminate('busy');
            }
            var roster_item = new RosterItem().getByJID(session.peerjid),
                peer = new Model('.jingle.peer').get();
            peer.fulljid = session.peerjid;
            peer.roster_item = roster_item.pk;
            peer.set(true);
            state.state = 'incoming';
            state.sid = sid;
            state.set()
        },
        remote_stream_added: function(data, sid) {
            var sess = this.jingle.sessions[sid],
                vid = document.getElementById('jingle-video'),
                that = this,
                sel = $(vid);
            vid.autoplay = true;
            this.RTC.attachMediaStream(sel, data.stream);
            console.log(data.stream);
            data.stream.onended = function() {
                console.log('stream ended', this.id);
            }
            var state = new Model('.jingle.state').get();
            state.src = sel.attr('src');
            state.set();
        },
        initiate: function(contact_pk) {
            var roster_item = new RosterItem().get(contact_pk);
            if (!this.jingle.localStream || !roster_item) {
                return;
            }
            var jid = roster_item.getIQJID();
            var peer = new Model('.jingle.peer').get();
            peer.fulljid = jid;
            peer.roster_item = roster_item.pk;
            peer.set(true);
            var state = new Model('.jingle.state').get();
            state.state = 'initiating';
            state.set();
            // TODO: handle errors
            this.jingle.initiate(jid);
        },
        hangup: function() {
            var state = new Model('.jingle.state').get();
            if (!state.state) return false;
            this.jingle.terminate();
        },
        accept_call: function() {
            var state = new Model('.jingle.state').get() || {},
                session = this.jingle.sessions[state.sid];
            if (state.state == 'incoming' && session) {
                session.sendAnswer();
                session.accept();
                state.state = 'active';
                state.set();
            }
        },
        toggle_fullscreen: function(new_state) {
            var state = new Model('.jingle.state').get();
            if (!state) {
                return;
            }
            if (new_state === undefined) {
                state.fullscreen = !state.fullscreen;
            } else {
                state.fullscreen = new_state;
            }
            state.set();
        }
    });
});
