"use strict";
define([], function() {
    var Storage = function(storage, root) {
        this._storage = storage
        this._root = '';
        root = root || '';
        this._root = this._evaluate_key(root);
        this.Element = Storage.Element
    }

    Storage.prototype.chroot = function() {
        var path = Array.prototype.slice.call(arguments, 0);
        return new Storage(this._storage, this._evaluate_key(path));
    }

    Storage.prototype.escape = function(string) {
        string = string.replace(/\\/g, '\\\\');
        string = string.replace(/\./g, '\\.');
        return string;
    }

    Storage.prototype._evaluate_key = function(path) {
        if (path instanceof Array) {
            path.map(this.escape);
            path = path.join('.');
        }
        var root = this._root;
        if (root != '') root += '.';
        return root + path;
    }

    Storage.prototype.path = function() {
        var path = Array.prototype.slice.call(arguments, 0);
        var key = this._evaluate_key(path);
        return new this.Element(this._storage, key);
    }

    Storage.prototype.getItem = function(key) {
        try {
            return this.path(key).get();
        } catch(e) {
            // XXX TODO: use storage exceptions here!!!
            return null;
        }
    }

    Storage.prototype.setItem = function(key, value) {
        this.path(key).set(value);
    }

    Storage.prototype.removeItem = function(key) {
        this.path(key).del();
    }

    var Element = function(storage, key) {
        this._storage = storage;
        this._key = key;
    }
    Storage.Element = Element;

    Element.prototype.exists = function() {
        return this._key in this._storage;
    }

    Element.prototype.del = function() {
        delete this._storage[this._key];
    }

    Element.prototype.get = function() {
        // TODO: caching
        var value = this._storage.getItem(this._key);
        var type = value.split('.', 1)[0];
        var value = value.slice(type.length + 1);
        if (type == 'json') {
            value = JSON.parse(value);
        } else if (type === 'undefined') {
            value = undefined;
        } else if (type === 'null') {
            value = null;
        } else if (type == 'plain') {
        } else {
            throw new Error("Unknown type " + type);
        }
        return value;
    }

    Element.prototype.set = function(value) {
        if (value instanceof Object || typeof(value) == 'boolean') {
            value = 'json.' + JSON.stringify(value);
        } else if (value === undefined) {
            value = 'undefined.';
        } else if (value === null) {
            value = 'null.';
        } else {
            value = 'plain.' + value;
        }
        this._storage.setItem(this._key, value);
    }

    Element.prototype.unescape = function(string) {
        var result = [];
        for (var i=0; i<string.length; i++) {
            if (string[i] == '\\') {
                result.push(string[i+1]);
                i++;
            } else {
                result.push(string[i]);
            }
        }
        return result.join('');
    }

    Element.prototype.get_path = function() {
        // TODO
    }

    return Storage;
});
