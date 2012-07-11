Spine = require('spine')

class CurrentUser extends Spine.Model
  @configure 'CurrentUser' , "username" , "email" , "authData" , "createdAt" , "updatedAt" , "sessionToken" , 
  "categories" , "status" , "description" , "providers"

  @extend Spine.Model.Ajax.Methods

  @url = "https://api.parse.com/1/users"  
  @key = "ajfhx_djw.2js_sj2wjszlp[1lsk"

  @afterSave: (user) =>
    if user.sessionToken
      $.ajaxSetup
           headers: {"X-Parse-Session-Token": user.sessionToken}

    result = JSON.stringify user
    localStorage[CurrentUser.key] = result
    Spine.user = user
    CurrentUser.trigger "currentUserSet" , user

  @fetch: =>    
    result = localStorage[CurrentUser.key]
    return false if result == undefined or result == null or !result
    result = JSON.parse(result)
    user = @create result    
    Spine.user = user
    CurrentUser.trigger "currentUserSet" , user

  @logout: ->
    Spine.user = null
    delete localStorage[CurrentUser.key]
    CurrentUser.destroyAll()
    CurrentUser.trigger "currentUserSet" , null

  @fromAuthData: (authData) ->
    user = null
    if authData.twitter
      username     =  authData.twitter.screen_name
      status       =  authData.twitter.details.status.text
      description  =  authData.twitter.details.description
      delete authData.twitter.details
      user = CurrentUser.create authData: authData , username: username , status: status, description: description
    user

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

  setProviders: ->
    @providers = if @authData.twitter then "twitter"

  provider: ->
    return if @authData.twitter then "twitter" else "facebook"

  forSave: =>
    data = 
      email       :  @email
      id          :  @id
      categories  :  @categories
      details     :  @details
    data
    

module.exports = CurrentUser