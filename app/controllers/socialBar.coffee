Spine = require('spine')
User = require('models/user')

class SocialBar extends Spine.Controller

  elements:
    ".users" : "users"

  constructor: ->
    super
    @el.html require("views/socialBar/layout")

    User.bind "refresh" , =>
      for user in User.all()
        @el.find(".users").append require("views/socialBar/user")(user)
        @el.find(".popable").popover({})
  
module.exports = SocialBar
