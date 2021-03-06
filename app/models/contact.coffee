Spine = require('spine')

class Contact extends Spine.Model
  @configure 'Contact' , "name" , "email" , "message" , "createdAt" , "updatedAt"
  @extend Spine.Model.Ajax
  
  @url = "https://api.parse.com/1/classes/Contact"
  
  @fromJSON: (objects) ->
    return unless objects

    if typeof objects is 'string'
      objects = JSON.parse(objects)

    objects = objects.results if objects.results      
    
    if Spine.isArray(objects)
      for object in objects
        if object.objectId
          object.id = object.objectId
          delete object.objectId
          delete object.cId
          
        
      (new @(value) for value in objects)
    else
      objects.id = objects.objectId if objects.objectId
      new @(objects)

  toJSON: (objects) ->
    atts = this.attributes();
    atts.objectId = atts.id if atts.objectId
    delete atts.id;
    return atts;

  
module.exports = Contact