Spine = require('spine')

class User extends Spine.Model
  @configure 'User' , "username" , "email" , "createdAt" , "categories" , "status", "description"
  @extend Spine.Model.Ajax

  @url = "https://api.parse.com/1/users"  

  @fetch: (params = {}) ->
    params or= {data: 'where={"username":"params.username"}' } if params.username
    super(params)

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
      (new @(value) for value in objects)
    else
      objects.id = objects.objectId if objects.objectId
      new @(objects)

  toJSON: () ->
    atts = this.attributes();
    return atts;

  
module.exports = User