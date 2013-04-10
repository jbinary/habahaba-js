modelEngine = function(data) {
    var dispatcher = {
        signals: {},
        data: data || {},
        //views: {},
        bind: function(signals, handler) {
            if (!(signals instanceof Array)) {
                signals = [signals];
            }
            var that = this;
            $.each(signals, function() {
                that.signals[this] = that.signals[this] || [];
                that.signals[this][that.signals[this].length] = handler;
            });
        },
        fire: function(signal, sender, params) {
            var signals = this.signals[signal] || [];
            for (var i=0; i<signals.length; i++) {
                var handler = signals[i];
                handler.apply(handler, [sender].concat(params));
            }
        },
        registerView: function(view) {
            this.views[view.model_name] = view;
        },
        render: function(model) {
            // TODO: check if view is ready
            var result;
            result = yr.run('main', this.data, model._model_name);
            return result;
            dispatcher.views[model._model_name].update(result, model);
        },
        start: function() {
            dispatcher.fire('dispatcher:ready');
            new Model('__main__').fireChanged();
            /*for (var i=0; i<views.length; i++) {
                var d = dispatcher.registerView(views[i]);
            }*/
            /*dispatcher.loadData().done(
                function() {
                    dispatcher.fire('dispatcher:ready');
                    new Model('__main__').fireChanged();
                }
            );*/
        }
    };

    if (window.XMLSerializer) {
        dispatcher.serializer = new XMLSerializer();
    }


    var Model = function(model_name, create_new) {
        this._model_name = model_name;
        this._path = model_name.split('.').slice(1);
        this._query = null;
    }

    Model.prototype.new = function() {
        var collection = this.getCollection();
        if (collection._pk_counter) {
            var _pk_counter = collection._pk_counter;
        } else {
            var _pk_counter = 0;
        }
        _pk_counter++;
        collection._pk_counter = _pk_counter;
        this.pk = _pk_counter;
        return this;
    }

    Model.prototype.toDocument = function() {
        var obj = {};
        for (var field in this) {
            if (field[0] != '_' && typeof this[field] != 'function') {
                obj[field] = this[field];
            }
        }
        return obj;
    } 

    Model.prototype.fromDocument = function(obj) {
        for (var field in obj) {
            if ((field[0] == '_') || 
                (obj[field] instanceof Function))
                 continue;
            if (obj[field] instanceof Array) {
                this[field] = obj[field].slice();
            } else if (obj[field] instanceof Date) {
                var cloned = new Date();
                cloned.setTime(obj[field].getTime());
                this[field] = cloned;
            } else if (obj[field] instanceof Object) {
                this[field] = obj[field].clone();
            } else {
                this[field] = obj[field]; // TODO: when tracking changes must go through objects instead of ==
            }
        }
        return this;
    }

    Model.prototype.getCollection = function(replace_with) {
        var current = dispatcher.data;
        for (var i=0; i<this._path.length; i++) {
            var component = this._path[i];
            if (current[component]) {
                if (replace_with && (i == this._path.length - 1)) {
                    replace_with._pk_counter = current[component]._pk_counter;
                    current[component] = replace_with;
                }
                current = current[component];
            } else
                return null;
        }
        return current;
    }

    Model.prototype.filter = function(query) {
        if (!(query instanceof Object)) {
            query = {pk: query}
        }
        var new_query = this._query || {};
        for (var f in query)
            new_query[f] = query[f];
        var chain = new Model(this._model_name);
        chain._query = new_query
        return chain
    }

    Model.prototype.execute = function(_raw) {
        var collection = this.getCollection();
        if (!collection) return null;
        var that = this;
        var results = collection.filter(function(o) {
            for (var q in that._query) {
                if (o[q] != that._query[q]) return false;
            }
            return true;
        });
        if (!_raw) {
            for (var i=0; i<results.length; i++) {
                results[i] = new Model(this._model_name).fromDocument(results[i]);
            }
        }
        return results;
    }

    Model.prototype.get = function(pk, _raw) {
        if (!(pk instanceof Object) && pk !== undefined) {
            var query = {pk: pk};
        } else if (!(pk instanceof Object)) {
            var query = {};
        } else if (pk instanceof Object) {
            var query = pk;
        }
        var m = new Model(this._model_name).filter(query);
        var results = m.execute(_raw);
        if (!results.length) return null;
        if (results.length > 1) throw new Error("More than 1 object returned"); // TODO: exception here
        return results[0];
    }

    Model.prototype.fireChanged = function(silently) {
        dispatcher.fire('model:' + this._model_name + ':changed', this);
        if (!silently) {
            dispatcher.fire('world:changed');
        }
    }

    Model.prototype.set = function(silently) {
        var obj = this.toDocument();
        var old_obj = new Model(this._model_name).get(this.pk, true);
        // fire attr changed event
        if (!old_obj) {
            var collection = this.getCollection();
            collection.push(obj);
            dispatcher.fire('model:' + this._model_name + ':added', this);
        }
        var that = this;
        if (old_obj && this.pk && this._model_name) {
            var anything_changed = false;
            var test = function(k) {
                if (k[0] != '_' && old_obj[k] != that[k] && !(that[k] instanceof Function)) {
                    dispatcher.fire('model:' + that._model_name + ':attr-changed:' + k,
                                    that, old_obj[k]);
                    anything_changed = true;
                    old_obj[k] = that[k];
                }
            };
            for (var key in this) test(key);
            for (var key in old_obj) {
                if (this[key] === undefined) test(key);
            };
            if (anything_changed) {
                this.fireChanged(silently);
            }
        } else if (!silently) dispatcher.fire('world:changed');

    }

    var _removeFromArray = function(array, index) {
        var rest = array.slice(index + 1 || array.length);
        array.length = index < 0 ? array.length + index: index;
        array.push.apply(array, rest);
        return array;
    }

    Model.prototype.del = function() {
        var collection = this.getCollection();
        var raw = this.get(this.pk, true);
        var index = collection.indexOf(raw);
        collection = _removeFromArray(collection, index);
        this.getCollection(collection);
        var pk = this.pk;
        this.pk = null;
        dispatcher.fire('model:' + this._model_name + ':deleted', this, pk);
        dispatcher.fire('world:changed');
    }

    Model.prototype.get_html_id = function() {
        return 'model-' + this._model_name + '-pk' + this.pk;
    }

    Model.prototype.jquery = function() {
        return $('[id="' + this.get_html_id() + '"]');
    }

    Model.prototype.getAll = function() {
        var collection = this.getCollection().slice();
        for (var i=0; i<collection.length; i++) {
            collection[i] = new Model(this._model_name).fromDocument(collection[i]);
        }
        return collection;
    }

    return {Model: Model,
            dispatcher: dispatcher};
}
