Spine = require('spine')
CurrentUser = require('models/currentUser')

class Header extends Spine.Controller

  events:
    "click .primaryLinks" : "onLinkClick"
    "click .login"        : "onLoginClick"
    "click .register"     : "onRegisterClick"
    "click .logout"       : "onLogoutClick"
    "click .edit"         : "onEditClick"

  elements:
    ".subnav" : "subnav"
    ".userImage" : "userImage"
    ".secondaryLinks" : "account"

  constructor: ->
    super
    @render()

    CurrentUser.bind "currentUserSet" , =>
      @render()

  render: =>
    if Spine.user
      @account.html require("views/header/conected")
    else
      @account.html require("views/header/disconected")

  onLoginClick: (e) ->
    Spine.trigger "show_modal" , "userRegistration" , action: "login"

  onLogoutClick: (e) ->
    CurrentUser.logout()

  onEditClick: (e) ->
    Spine.trigger "show_modal" , "userRegistration" , action: "edit"

  onRegisterClick: (e) ->
    Spine.trigger "show_modal" , "userRegistration" , action: "register"

  onLinkClick: (e) =>
    @subnav.removeClass "visible"
    @subnav.removeClass "active"
    target = $(e.target)
    target = target.parents('li') if !target.hasClass("link")
    subnavName = target.attr "data-subnav"
    
    if subnavName
      subnav = @el.find(".#{subnavName}")
      subnav.addClass "active"
      setTimeout =>
        subnav.addClass "visible" , 1

    else
      link = target.find("a").attr("href")
      console.log link
      window.location = link 

module.exports = Header
