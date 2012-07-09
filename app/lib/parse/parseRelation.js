(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creates a new Relation for the given parent object and key. This
   * constructor should rarely be used directly, but rather created by
   * Parse.Object.relation.
   * @param {Parse.Object} parent The parent of this relation.
   * @param {String} key The key for this relation on the parent.
   * @see Parse.Object#relation
   * @class
   *
   * <p>
   * A class that is used to access all of the children of a many-to-many
   * relationship.  Each instance of Parse.Relation is associated with a
   * particular parent object and key.
   * </p>
   */
  Parse.Relation = function(parent, key) {
    this.parent = parent;
    this.key = key;
    this.targetClassName = null;
    this.relationsToAdd = [];
    this.relationsToRemove = [];
  };

  Parse.Relation.prototype = {
    /**
     * Adds a Parse.Object or an array of Parse.Objects to the relation.
     * @param {} objects The item or items to add.
     */
    add: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      if (!this.targetClassName) {
        this.targetClassName = objects[0].className;
      }

      var self = this;
      _.each(objects, function(object) {
        if (self.targetClassName !== object.className) {
          throw "This relation is on objects of class:" + 
                self.targetClassName + " but got object of class:" +
                object.className;
        }
      });

      objects = _.map(objects,
                      function(object) { return object.id; });
      this.relationsToAdd = _.union(this.relationsToAdd, objects);
      this.relationsToRemove = _.difference(this.relationsToRemove, objects);
    },

    /**
     * Removes a Parse.Object or an array of Parse.Objects from this relation.
     * @param {} objects The item or items to remove.
     */
    remove: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      if (!this.targetClassName) {
        this.targetClassName = objects[0].className;
      }

      var self = this;
      _.each(objects, function(object) {
        if (self.targetClassName !== object.className) {
          throw "This relation is on objects of class:" + 
                self.targetClassName + " but got object of class:" +
                object.className;
        }
      });


      objects = _.map(objects,
                      function(object) { return object.id; });
      this.relationsToRemove = _.union(this.relationsToRemove, objects);
      this.relationsToAdd = _.difference(this.relationsToAdd, objects);
    },

    _dirty: function() {
      return this.relationsToAdd.length > 0 ||
             this.relationsToRemove.length > 0;
    },

    /**
     * Returns a JSON version of the object suitable for saving to parse.
     * @return {Object}
     */
    toJSON: function() {
      var adds = null;
      var removes = null;
      var self = this;
      var idToPointer = function(id) {
        return { __type: 'Pointer',
                 className: self.targetClassName,
                 objectId: id };
      };
      var pointers = null;
      if (this.relationsToAdd.length > 0) {
        pointers = _.map(this.relationsToAdd, idToPointer);
        adds = { "__op": "AddRelation", "objects": pointers };
      }

      if (this.relationsToRemove.length > 0) {
        pointers = _.map(this.relationsToRemove, idToPointer);
        removes = { "__op": "RemoveRelation", "objects": pointers };
      }

      if (adds && removes) {
        return { "__op": "Batch", "ops": [adds, removes]};
      }

      return adds || removes ||
             { "__type": "Relation", "className": this.targetClassName };
    },

    /**
     * Returns a Parse.Query that is limited to objects in this
     * relation.
     * @return {Parse.Query}
     */
    query: function() {
      var targetClass = Parse.Object._getSubclass(this.targetClassName);
      var query = new Parse.Query(targetClass);
      query._addCondition("$relatedTo", "object", this.parent._toPointer());
      query._addCondition("$relatedTo", "key", this.key);
      return query;
    },

    _clearUpdates: function () {
      this.relationsToRemove = [];
      this.relationsToAdd = [];
    }
  };
}(this));

