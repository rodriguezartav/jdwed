Spine   = require('spine')
$       = Spine.$
CurrentUser = require('models/currentUser')
User = require('models/user')

class UserRegistrationModal extends Spine.Controller
  @extend Spine.Controller.Modal
  @extend Spine.Controller.ViewDelegation

  className: 'showUserRegistration modal'

  @type = "userRegistration"

  elements:
    ".validatable"    : "inputs_to_validate"
    ".categorias"     : "categorias"
    ".alert"          : "alert"

  events:
    "click .cancel"      :   "onClose"
    "click .accept"      :   "onTwitterSubmit"
    "click .badge"       :   "onCategoriasClick"

  constructor: ->
    super

    if @data.action == "create"
      @html require("views/modals/userRegistration/working")(@data.authData)
      console.log @data.authData.twitter.details
      user = CurrentUser.fromAuthData(@data.authData)
      user.ajax().create {}, { success: @onCreateSuccess  } 
    else if @data.action == "edit"
      @render()

  onCreateSuccess: =>
    @render()

  render: =>
    console.log Spine.user
    @html require("views/modals/userRegistration/layout_#{Spine.user.provider()}")(Spine.user)
    @badgesOn()

  badgesOn: ->
    badges = @el.find(".badge.check")
    for badge in badges
      badge = $(badge)
      badge.addClass "active" if Spine.user?.categories?.indexOf(badge.attr("data-value")) > -1

  onCategoriasClick: (e) =>
    badge = $(e.target)
    if badge.hasClass "active"
      badge.removeClass "active"
    else
      badge.addClass "active"

  onTwitterSubmit: =>
    try
      @updateFromView(Spine.user,@inputs_to_validate)
      categories = []
      badges = @el.find(".badge.check.active")
      for badge in badges
        categories.push $(badge).attr "data-value"

      Spine.user.categories = categories
      Spine.user.save()
      Spine.user.ajax().update( {} , { success: @onUpdateSuccess , error: @onUpdateError }  )   
      @alert.html "Se han guardado los cambios"
      @alert.addClass "alert-success"
    catch err
      @alert.addClass "alert-error"
      @alert.html require("views/errors/validationError")(err)

  onUpdateSuccess: ->
    Spine.trigger "hide_modal"

  onUpdateError: (xhr, statusText, error) =>
    @alert.addClass "alert-error"
    @alert.html require("views/errors/validationError")(err)
  
  onClose: =>
    CurrentUser.logout() if @data.authData
    Spine.trigger "hide_modal"

module.exports = UserRegistrationModal
