Spine = require('spine')
User = require('models/user')

class SocialBar extends Spine.Controller

  elements:
    ".users" : "users"
  
  events:
    "click .sendPM" : "onClickSendPM"
    "click .showFriends" : "onClickShowFriends"
    

  constructor: ->
    super
    @el.html require("views/socialBar/layout")

    User.bind "refresh" , =>
      for user in User.all()
        @el.find(".users").append require("views/socialBar/user")(user)
        @el.find(".popable").popover({})

  onClickSendPM: (e) ->
    target = $(e.target)
    target = target.parents('span') if !target.hasClass "sendPM"
    id = target.attr "data-id"
    user = User.find id
    console.log user.email
    if user.email
      Spine.trigger "show_modal" , "privateMessage" , user: user    
    else
      alert "Lo sentimos el usuario no tiene email registrado"


  onClickShowFriends: (e) ->
    target = $(e.target)
    target = target.parents('span') if !target.hasClass "showFriends"
    id = target.attr "data-id"
    user = User.find id
    console.log user.email
    if user.email
      Spine.trigger "show_modal" , "showFriends" , user: user    
    else
      alert "Lo sentimos el usuario no tiene email registrado"
    
    

module.exports = SocialBar
