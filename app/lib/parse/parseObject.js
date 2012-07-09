// Parse.Object is analogous to the Java ParseObject.
// It also implements the same interface as a Backbone model.
//keep modify
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  // Helper function to check null or undefined.
  var isNullOrUndefined = function(x) {
    return _.isNull(x) || _.isUndefined(x);
  };

  /**
   * Creates a new model with defined attributes. A client id (cid) is
   * automatically generated and assigned for you.
   *
   * <p>You won't normally call this method directly.  It is recommended that
   * you use a subclass of <code>Parse.Object</code> instead, created by calling
   * <code>extend</code>.<p>
   *
   * <p>However, if you don't want to use a subclass, or aren't sure which
   * subclass is appropriate, you can use this form:<pre>
   *     var object = new Parse.Object("ClassName");
   * </pre>
   * That is basically equivalent to:<pre>
   *     var MyClass = Parse.Object.extend("ClassName");
   *     var object = new MyClass();
   * </pre></p>
   *
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @see Parse.Object.extend
   *
   * @class
   *
   * <p>The fundamental unit of Parse data, which implements the Backbone Model
   * interface.</p>
   */
  Parse.Object = function(attributes, options) {
    // Allow new Parse.Object("ClassName") as a shortcut to _create.
    if (_.isString(attributes)) {
      return Parse.Object._create.apply(this, arguments);
    }

    attributes = attributes || {};
    if (options && options.parse) {
      attributes = this.parse(attributes);
    }
    var defaults = Parse._getValue(this, 'defaults');
    if (defaults) {
      attributes = _.extend({}, defaults, attributes);
    }
    if (options && options.collection) {
      this.collection = options.collection;
    }
    this.attributes = {};  // The actual data for the Parse Object.
    this._operations = {};  // Operations such as increment and unset.
    this._dirty = {};  // The keys in the object that haven't been saved.
    this._hashedJSON = {};  // Hash of values of containers at last save.
    this._escapedAttributes = {};
    this.cid = _.uniqueId('c');
    if (!this.set(attributes, {silent: true})) {
      throw new Error("Can't create an invalid Parse.Object");
    }
    delete this._changed;
    this._previousAttributes = _.clone(this.attributes);
    this.initialize.apply(this, arguments);
  };

  /**
   * @lends Parse.Object.prototype
   * @property {String} id The objectId of the Parse Object.
   */

  /**
   * Internal function for saveAll.  This calls func on every item in list,
   * and adds the results to results.  When it's done, optionsOrCallback is
   * called with the accumulated results.  See saveAll for more info.
   *
   * @param list - A list of Parse.Object.
   * @param func - function(Parse.Object, callback);
   * @param results - List of results.  Should be [] for non-recursion.
   * @param optionsOrCallback - See saveAll.
   */
  var _doAll = function(list, func, results, optionsOrCallback) {
    results = results || [];
    var options;
    if (_.isFunction(optionsOrCallback)) {
      var callback = optionsOrCallback;
      options = {
        success: function(list) { callback(list, null); },
        error: function(e) { callback(null, e); }
      };
    } else {
      options = optionsOrCallback;
    }
    if (list.length) {
      var oldOptions = options;
      var newOptions = options ? _.clone(options) : {};
      newOptions.success = function(model, response) {
        results.push(model);
        _doAll(list.slice(1), func, results, oldOptions);
      };
      func.call(this, list[0], newOptions);
    } else {
      if (options.success) {
        options.success(results);
      }
    }
  };

  /**
   * Saves the given list of Parse.Object.
   * If any error is encountered, stops and calls the error handler.
   * There are two ways you can call this function.
   *
   * The Backbone way:<pre>
   *   Parse.Object.saveAll([object1, object2, ...], {
   *     success: function(list) {
   *       // All the objects were saved.
   *     },
   *     error: function(error) {
   *       // An error occurred while saving one of the objects.
   *     },
   *   });
   * </pre>
   * A simplified syntax:<pre>
   *   Parse.Object.saveAll([object1, object2, ...], function(list, error) {
   *     if (list) {
   *       // All the objects were saved.
   *     } else {
   *       // An error occurred.
   *     }
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>Parse.Object</code>.
   * @param {Object} optionsOrCallback A Backbone-style callback object.
   */
  Parse.Object.saveAll = function(list, optionsOrCallback) {
    _doAll(list, function(obj, options) {
      obj.save(null, options);
    }, [], optionsOrCallback);
  };

  Parse.Object._signUpAll = function(list, optionsOrCallback) {
      _doAll(list, function(obj, options) {
        obj.signUp(null, options);
      }, [], optionsOrCallback);
  };

  // Attach all inheritable methods to the Parse.Object prototype.
  _.extend(Parse.Object.prototype, Parse.Events,
           /** @lends Parse.Object.prototype */ {
           
    _existed: false,

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    /**
     * Returns a JSON version of the object suitable for saving to Parse.
     * @return {Object}
     */
    toJSON: function() {
      var json = _.clone(this.attributes);
      _.each(["createdAt", "objectId", "updatedAt"], function(key) {
        delete json[key];
      });
      Parse._each(json, function(val, key) {
        json[key] = Parse._encode(val);
      });
      Parse._each(this._operations, function(val, key) {
        json[key] = val;
      });
      return json;
    },

    /**
     * Updates _hashedJSON to reflect the current state of this object.
     * Adds any changed hash values to the _dirty set.
     */
    _refreshCache: function() {
      var self = this;
      Parse._each(this.attributes, function(value, key) {
        if (value instanceof Parse.Object) {
          value._refreshCache();
        } else if (_.isObject(value)) {
          if (value.toJSON) {
            value = value.toJSON();
          }
          var json = JSON.stringify(value);
          if (self._hashedJSON[key] !== json) {
            self._hashedJSON[key] = json;
            self._dirty[key] = true;
          }
        }
      });
      // If any of these special keys get in the dirty list, take them out.
      _.each(["createdAt", "objectId", "updatedAt"], function(key) {
        delete self._dirty[key];
      });
    },

    /**
     * Returns true if this object has been modified since its last
     * save/refresh.  If an attribute is specified, it returns true only if that
     * particular attribute has been modified since the last save/refresh.
     * @param {String} attr An attribute name (optional).
     * @return {Boolean}
     */
    dirty: function(attr) {
      this._refreshCache();
      if (attr) {
        return (this._dirty[attr] ? true : false);
      }
      if (!this.id) {
        return true;
      }
      if (_.keys(this._dirty).length > 0) {
        return true;
      }
      return false;
    },

    /**
     * Gets a Pointer referencing this Object.
     */
    _toPointer: function() {
      if (!this.id) {
        throw new Error("Can't serialize an unsaved Parse.Object");
      }
      return { __type: "Pointer",
               className: this.className,
               objectId: this.id };
    },

    /**
     * Gets the value of an attribute.
     * @param {String} attr The string name of an attribute.
     */
    get: function(attr) {
      return this.attributes[attr];
    },

    /**
     * Gets a relation on the given class for the attribute.
     * @param String attr The attribute to get the relation for.
     */
    relation: function(attr) {
      var oldValue = this.get(attr);
      if (oldValue) {
        if (!(oldValue instanceof Parse.Relation)) {
          throw attr + " does contain have a relation";
        }
        return oldValue;
      }

      var returnValue = new Parse.Relation(this, attr);
      this.set(attr, returnValue);
      return returnValue;
    },

    /**
     * Gets the HTML-escaped value of an attribute.
     */
    escape: function(attr) {
      var html = this._escapedAttributes[attr];
      if (html) {
        return html;
      }
      var val = this.attributes[attr];
      var escaped;
      if (isNullOrUndefined(val)) {
        escaped = '';
      } else {
        escaped = _.escape(val.toString());
      }
      this._escapedAttributes[attr] = escaped;
      return escaped;
    },

    /**
     * Returns <code>true</code> if the attribute contains a value that is not
     * null or undefined.
     * @param {String} attr The string name of the attribute.
     * @return {Boolean}
     */
    has: function(attr) {
      return !isNullOrUndefined(this.attributes[attr]);
    },

    /**
     * Pulls "special" fields like objectId, createdAt, etc. out of attrs
     * and puts them on "this" directly.  Removes them from attrs.
     * @param attrs - A dictionary with the data for this Parse.Object.
     */
    _mergeMagicFields: function(attrs) {
      // Check for changes of magic fields.
      var model = this;
      _.each(["id", "objectId", "createdAt", "updatedAt"], function(attr) {
        if (attrs[attr]) {
          if (attr === "objectId") {
            model.id = attrs[attr];
          } else {
            model[attr] = attrs[attr];
          }
          delete attrs[attr];
        }
      });
    },

    _handleSetOp: function(key, op) {
      if (op.__op === 'Batch') {
        var self = this;
        var success = true;
        Parse._each(op.ops, function(subOp) {
          success = success && self._handleSetOp(key, subOp);
        });
      } else if (op.__op === 'Increment') {
        this.attributes[key] = this.attributes[key] || 0;
        this.attributes[key] += op.amount;
        this._dirty[key] = true;
      } else if (op.__op === 'AddRelation') {
        var relationForAdd = this.relation(key);
        relationForAdd.add(op.objects);
        this._dirty[key] = true;
      } else if (op.__op === 'RemoveRelation') {
        var relationForDelete = this.relation(key);
        relationForDelete.remove(op.objects);
        this._dirty[key] = true;
      } else if (op.__op === 'Delete') {
        this._dirty[key] = true;
        delete this.attributes[key];
      } else {
        return false;
      }
      return true;
    },

    /**
     * Sets a hash of model attributes on the object, firing
     * <code>"change"</code> unless you choose to silence it.
     *
     * <p>You can call it with an object containing keys and values, or with one
     * key and value.  For example:<pre>
     *   gameTurn.set({
     *     player: player1,
     *     diceRoll: 2
     *   }, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
     *
     *   game.set("currentPlayer", player2, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
     *
     *   game.set("finished", true);</pre></p>
     * 
     * @param {String} key The key to set.
     * @param {} value The value to give it.
     * @param {Object} options A set of Backbone-like options for the set.
     *     The only supported options are <code>silent</code> and
     *     <code>error</code>.
     * @return {Boolean} true if the set succeeded.
     * @see Parse.Object#validate
     * @see Parse.Error
     */
    set: function(key, value, options) {
      var attrs, attr;
      if (_.isObject(key) || isNullOrUndefined(key)) {
        attrs = key;
        Parse._each(attrs, function(v, k) {
          attrs[k] = Parse._decode(k, v);
        });
        options = value;
      } else {
        attrs = {};
        attrs[key] = Parse._decode(key, value);
      }

      // Extract attributes and options.
      options = options || {};
      if (!attrs) {
        return this;
      }
      
      if (attrs instanceof Parse.Object) {
        attrs = attrs.attributes;
      }
      if (options.unset) {
        Parse._each(attrs, function(unused_value, attr) {
          attrs[attr] = undefined;
        });
      }

      // Run validation.
      if (!this._validate(attrs, options)) {
        return false;
      }

      this._mergeMagicFields(attrs);

      var now = this.attributes;
      var escaped = this._escapedAttributes;
      var prev = this._previousAttributes || {};
      var alreadySetting = this._setting;
      this._changed = this._changed || {};
      this._setting = true;

      // Update attributes.
      var self = this;
      Parse._each(_.keys(attrs), function(attr) {
        var val = attrs[attr];

        // If this is a relation object we need to set the parent correctly,
        // since the location where it was parsed does not have access to
        // this object.
        if (val instanceof Parse.Relation) {
          val.parent = self;
        }

        var handledOp = false;
        if (_.isObject(val) && _.has(val, '__op')) {
          handledOp = self._handleSetOp(attr, val);
        } else {
          if (!_.isEqual(now[attr], val)) {
            delete escaped[attr];
          }
          if (options.unset) {
            delete now[attr];
            self._dirty[attr] = true;
            self._operations[attr] = { __op: 'Delete' };
          } else {
            now[attr] = val;
            self._dirty[attr] = true;
            // If this field was previously scheduled for deletion, undo that.
            if (_.isObject(self._operations[attr]) &&
                self._operations[attr].__op === 'Delete') {
              delete self._operations[attr];
            }
          }
        }
        if (self._changing && !_.isEqual(self._changed[attr], val)) {
          self.trigger('change:' + attr, self, val, options);
          self._moreChanges = true;
        }
        delete self._changed[attr];
        if (!_.isEqual(prev[attr], val) ||
            handledOp ||
            (_.has(now, attr) !== _.has(prev, attr))) {
          self._changed[attr] = val;
        }
      });

      // Fire the `"change"` events, if the model has been changed.
      if (!alreadySetting) {
        if (!options.silent && this.hasChanged()) {
          this.change(options);
        }
        this._setting = false;
      }

      return this;
    },

    /**
     * Remove an attribute from the model, firing <code>"change"</code> unless
     * you choose to silence it. This is a noop if the attribute doesn't
     * exist.
     */
    unset: function(attr, options) {
      options = options || {};
      options.unset = true;
      return this.set(attr, null, options);
    },

    /**
     * Clear all attributes on the model, firing <code>"change"</code> unless
     * you choose to silence it.
     */
    clear: function(options) {
      options = options || {};
      options.unset = true;
      var keysToClear = _.extend(this.attributes, this._operations);
      return this.set(keysToClear, options);
    },

    /**
     * Fetch the model from the server. If the server's representation of the
     * model differs from its current attributes, they will be overriden,
     * triggering a <code>"change"</code> event.
     */
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        if (!model.set(model.parse(resp, status, xhr), options)) {
          return false;
        }
        if (success) {
          model._refreshCache();
          model._dirty = {};
          success(model, resp);
        }
      };
      options.error = Parse.Object._wrapError(options.error, model, options);
      Parse._request(
        "classes", model.className, model.id, 'GET', null, options);
    },

    /**
     * Set a hash of model attributes, and save the model to the server.
     * updatedAt will be updated when the request returns.
     * You can either call it as:<pre>
     *   object.save();</pre>
     * or<pre>
     *   object.save(null, options);</pre>
     * or<pre>
     *   object.save(attrs, options);</pre>
     * or<pre>
     *   object.save(key, value, options);</pre>
     *
     * For example, <pre>
     *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }, {
     *     success: function(gameTurnAgain) {
     *       // The save was successful.
     *     },
     *     error: function(gameTurnAgain, error) {
     *       // The save failed.  Error is an instance of Parse.Error.
     *     }
     *   });</pre>
     * 
     * @see Parse.Error
     */
    save: function(arg1, arg2, arg3) {
      var i, attrs, current, options, saved;
      if (_.isObject(arg1) || isNullOrUndefined(arg1)) {
        attrs = arg1;
        options = arg2;
      } else {
        attrs = {};
        attrs[arg1] = arg2;
        options = arg3;
      }

      // Make save({ success: function() {} }) work.
      if (!options && attrs) {
        var extra_keys = _.reject(attrs, function(value, key) {
          return _.include(["success", "error", "wait"], key);
        });
        if (extra_keys.length === 0) {
          var all_functions = true;
          if (_.has(attrs, "success") && !_.isFunction(attrs.success)) {
            all_functions = false;
          }
          if (_.has(attrs, "error") && !_.isFunction(attrs.error)) {
            all_functions = false;
          }
          if (all_functions) {
            // This attrs object looks like it's really an options object,
            // and there's no other options object, so let's just use it.
            return this.save(null, attrs);
          }
        }
      }

      options = options ? _.clone(options) : {};
      if (options.wait) {
        current = _.clone(this.attributes);
      }
      var silentOptions = _.extend({}, options, {silent: true});
      if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
        return false;
      }
      var oldOptions = options;  // Psuedonym more accurate in some contexts.
      var newOptions = _.clone(options);

      var model = this;

      // A function that will re-call this function with the same arguments.
      // This will be used in the loop below, but JSLint insists it go here.
      var saveThisModel = function(child, resp) {
        model.save(null, oldOptions);
      };

      // If there is any unsaved child, save it first.
      model._refreshCache();
      var keys = _.keys(model.attributes);
      for (i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var child = model.attributes[key];
        if (child instanceof Parse.Object) {
          if (child.dirty()) {
            // This child is unsaved, so save it, and have the callback try to
            // save this model again.
            newOptions.success = saveThisModel;
            child.save(null, newOptions);
            return this;
          }
        } else if (child instanceof Parse.Relation && child._dirty()) {
          model._dirty[key] = true;
        }
      }

      // Record what was saved, so we can update dirty fields correctly.
      var savedData = _.clone(model.attributes);
      var savedOperations = _.clone(model._operations);

      /** ignore */
      newOptions.success = function(resp, status, xhr) {
        var serverAttrs = model.parse(resp, status, xhr);
        if (newOptions.wait) {
          serverAttrs = _.extend(attrs || {}, serverAttrs);
        }
        if (!model.set(serverAttrs, newOptions)) {
          return false;
        }

        var keys = _.keys(model.attributes);
        Parse._each(model.attributes, function(child, key) {
          if (child instanceof Parse.Relation) {
            child._clearUpdates();
          }
        });

        if (oldOptions.success) {
          model._refreshCache();
          Parse._each(savedData, function(savedValue, savedKey) {
            if (savedValue === model.get(savedKey)) {
              delete model._dirty[savedKey];
            }
          });
          Parse._each(savedOperations, function(unusedValue, savedKey) {
            delete model._dirty[savedKey];
          });
          oldOptions.success(model, resp);
        } else {
          model.trigger('sync', model, resp, newOptions);
        }
      };
      newOptions.error = Parse.Object._wrapError(oldOptions.error, model,
                                                 newOptions);

      var method = this.id ? 'PUT' : 'POST';
      var json = this.toJSON();
      // Remove fields that aren't dirty.
      model._refreshCache();
      Parse._each(json, function(value, key) {
        if (!model._dirty[key]) {
          delete json[key];
        }
      });

      var route = "classes";
      var className = this.className;
      if (this.className === "_User" && !this.id) {
        // Special-case user sign-up.
        route = "users";
        className = null;
      }
      Parse._request(route, className, this.id, method, json, newOptions);
      if (newOptions.wait) {
        this.set(current, silentOptions);
      }

      return this;
    },

    /**
     * Destroy this model on the server if it was already persisted.
     * Optimistically removes the model from its collection, if it has one.
     * If `wait: true` is passed, waits for the server to respond
     * before removal.
     */
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var triggerDestroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      if (!this.id) {
        return triggerDestroy();
      }
      /** ignore */
      options.success = function(resp) {
        if (options.wait) {
          triggerDestroy();
        }
        if (success) {
          success(model, resp);
        } else {
          model.trigger('sync', model, resp, options);
        }
      };
      options.error = Parse.Object._wrapError(options.error, model, options);

      Parse._request("classes", this.className, this.id, 'DELETE', null,
                    options);
      if (!options.wait) {
        triggerDestroy();
      }
    },

    /**
     * Converts a response into the hash of attributes to be set on the model.
     * @ignore
     */
    parse: function(resp, status, xhr) {
      var output = _.clone(resp);
      _(["createdAt", "updatedAt"]).each(function(key) {
        if (output[key]) {
          output[key] = Parse._parseDate(output[key]);
        }
      });
      if (!output.updatedAt) {
        output.updatedAt = output.createdAt;
      }
      if (status) {
        this._existed = (status.status !== 201);
      }
      return output;
    },

    /**
     * Creates a new model with identical attributes to this one.
     * @return {Parse.Object}
     */
    clone: function() {
      return new this.constructor(this.attributes);
    },

    /**
     * Returns true if this object has never been saved to Parse.
     * @return {Boolean}
     */
    isNew: function() {
      return !this.id;
    },
    
    /**
     * Returns true if this object was created by the Parse server when the
     * object might have already been there (e.g. in the case of a Facebook
     * login)
     */
    existed: function() {
      return this._existed;
    },

    /**
     * Call this method to manually fire a <code>"change"</code> event for this
     * model and a <code>"change:attribute"</code> event for each changed
     * attribute.  Calling this will cause all objects observing the model to
     * update.
     */
    change: function(options) {
      var self = this;
      if (this._changing || !this.hasChanged()) {
        return this;
      }
      this._changing = true;
      this._moreChanges = true;
      Parse._each(this._changed, function(value, attr) {
        self.trigger('change:' + attr, self, value, options);
      });
      while (this._moreChanges) {
        this._moreChanges = false;
        this.trigger('change', this, options);
      }
      this._previousAttributes = _.clone(this.attributes);
      delete this._changed;
      this._changing = false;
      return this;
    },

    /**
     * Determine if the model has changed since the last <code>"change"</code>
     * event.  If you specify an attribute name, determine if that attribute
     * has changed.
     * @param {String} attr Optional attribute name
     * @return {Boolean}
     */
    hasChanged: function(attr) {
      if (!arguments.length) {
        return !_.isEmpty(this._changed);
      }
      return this._changed && _.has(this._changed, attr);
    },

    /**
     * Returns an object containing all the attributes that have changed, or
     * false if there are no changed attributes. Useful for determining what
     * parts of a view need to be updated and/or what attributes need to be
     * persisted to the server. Unset attributes will be set to undefined.
     * You can also pass an attributes object to diff against the model,
     * determining if there *would be* a change.
     */
    changedAttributes: function(diff) {
      if (!diff) {
        return this.hasChanged() ? _.clone(this._changed) : false;
      }
      var changed = {};
      var old = this._previousAttributes;
      Parse._each(diff, function(diffVal, attr) {
        if (!_.isEqual(old[attr], diffVal)) {
          changed[attr] = diffVal;
        }
      });
      return changed;
    },

    /**
     * Gets the previous value of an attribute, recorded at the time the last
     * <code>"change"</code> event was fired.
     * @param {String} attr Name of the attribute to get.
     */
    previous: function(attr) {
      if (!arguments.length || !this._previousAttributes) {
        return null;
      }
      return this._previousAttributes[attr];
    },

    /**
     * Gets all of the attributes of the model at the time of the previous
     * <code>"change"</code> event.
     * @return {Object}
     */
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    /**
     * Checks if the model is currently in a valid state. It's only possible to
     * get into an *invalid* state if you're using silent changes.
     * @return {Boolean}
     */
    isValid: function() {
      return !this.validate(this.attributes);
    },

    /**
     * You should not call this function directly unless you subclass
     * <code>Parse.Object</code>, in which case you can override this method
     * to provide additional validation on <code>set</code> and
     * <code>save</code>.  Your implementation should return 
     *
     * @param {Object} attrs The current data to validate.
     * @param {Object} options A Backbone-like options object.
     * @return {} False if the data is valid.  An error object otherwise.
     * @see Parse.Object#set
     */
    validate: function(attrs, options) {
      if (_.has(attrs, "ACL") && !(attrs.ACL instanceof Parse.ACL)) {
        return new Parse.Error(Parse.Error.OTHER_CAUSE,
                               "ACL must be a Parse.ACL.");
      }
      return false;
    },

    /**
     * Run validation against a set of incoming attributes, returning `true`
     * if all is well. If a specific `error` callback has been passed,
     * call that instead of firing the general `"error"` event.
     */
    _validate: function(attrs, options) {
      if (options.silent || !this.validate) {
        return true;
      }
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validate(attrs, options);
      if (!error) {
        return true;
      }
      if (options && options.error) {
        options.error(this, error, options);
      } else {
        this.trigger('error', this, error, options);
      }
      return false;
    },

    /**
     * Returns the ACL for this object.
     * @returns {Parse.ACL} An instance of Parse.ACL.
     * @see Parse.Object#get
     */
    getACL: function() {
      return this.get("ACL");
    },

    /**
     * Sets the ACL to be used for this object.
     * @param {Parse.ACL} acl An instance of Parse.ACL.
     * @param {Object} options Optional Backbone-like options object to be
     *     passed in to set.
     * @return {Boolean} Whether the set passed validation.
     * @see Parse.Object#set
     */
    setACL: function(acl, options) {
      return this.set("ACL", acl, options);
    }

  });

  /**
   * Returns the appropriate subclass for making new instances of the given
   * className string.
   */
  Parse.Object._getSubclass = function(className) {
    if (!_.isString(className)) {
      throw "Parse.Object._getSubclass requires a string argument.";
    }
    var ObjectClass = Parse.Object._classMap[className];
    if (!ObjectClass) {
      ObjectClass = Parse.Object.extend(className);
      Parse.Object._classMap[className] = ObjectClass;
    }
    return ObjectClass;
  };

  /**
   * Creates an instance of a subclass of Parse.Object for the given classname.
   */
  Parse.Object._create = function(className, attributes, options) {
    var ObjectClass = Parse.Object._getSubclass(className);
    return new ObjectClass(attributes, options);
  };

  // Set up a map of className to class so that we can create new instances of
  // Parse Objects from JSON automatically.
  Parse.Object._classMap = {};

  Parse.Object._extend = Parse._extend;

  /**
   * Creates a new subclass of Parse.Object for the given Parse class name.
   *
   * <p>Every extension of a Parse class will inherit from the most recent
   * previous extension of that class. When a Parse.Object is automatically
   * created by parsing JSON, it will use the most recent extension of that
   * class.</p>
   *
   * <p>You should call either:<pre>
   *     var MyClass = Parse.Object.extend("MyClass", {
   *         <i>Instance properties</i>
   *     }, {
   *         <i>Class properties</i>
   *     });</pre>
   * or, for Backbone compatibility:<pre>
   *     var MyClass = Parse.Object.extend({
   *         className: "MyClass",
   *         <i>Other instance properties</i>
   *     }, {
   *         <i>Class properties</i>
   *     });</pre></p>
   *
   * @param {String} className The name of the Parse class backing this model.
   * @param {Object} protoProps Instance properties to add to instances of the
   *     class returned from this method.
   * @param {Object} classProps Class properties to add the class returned from
   *     this method.
   * @return {Class} A new subclass of Parse.Object.
   */
  Parse.Object.extend = function(className, protoProps, classProps) {
    // Handle the case with only two args.
    if (!_.isString(className)) {
      if (className && _.has(className, "className")) {
        return Parse.Object.extend(className.className, className, protoProps);
      } else {
        throw new Error(
            "Parse.Object.extend's first argument should be the className.");
      }
    }

    // If someone tries to subclass "User", coerce it to the right type.
    if (className === "User") {
      className = "_User";
    }

    var NewClassObject = null;
    if (_.has(Parse.Object._classMap, className)) {
      var OldClassObject = Parse.Object._classMap[className];
      NewClassObject = OldClassObject._extend(protoProps, classProps);
    } else {
      protoProps = protoProps || {};
      protoProps.className = className;
      NewClassObject = Parse.Object._extend(protoProps, classProps);
    }
    // Extending a subclass should reuse the classname automatically.
    NewClassObject.extend = function(arg0) {
      if (_.isString(arg0) || (arg0 && _.has(arg0, "className"))) {
        return Parse.Object.extend.apply(NewClassObject, arguments);
      }
      var newArguments = [className].concat(Parse._.toArray(arguments));
      return Parse.Object.extend.apply(NewClassObject, newArguments);
    };
    Parse.Object._classMap[className] = NewClassObject;
    return NewClassObject;
  };

  /**
   * Wrap an optional error callback with a fallback error event.
   */
  // Wrap an optional error callback with a fallback error event.
  Parse.Object._wrapError = function(onError, originalModel, options) {
    return function(model, response) {
      if (model !== originalModel) {
        response = model;
      }
      var error = new Parse.Error(-1, response.responseText);
      if (response.responseText) {
        var errorJSON = JSON.parse(response.responseText);
        if (errorJSON) {
          error = new Parse.Error(errorJSON.code, errorJSON.error);
        }
      }
      if (onError) {
        onError(originalModel, error, options);
      } else {
        originalModel.trigger('error', originalModel, error, options);
      }
    };
  };
}(this));
