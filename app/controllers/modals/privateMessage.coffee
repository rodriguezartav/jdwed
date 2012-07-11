Spine   = require('spine')
$       = Spine.$
CurrentUser = require('models/currentUser')
User = require('models/user')

class PrivateMessageModal extends Spine.Controller
  @extend Spine.Controller.Modal
  @extend Spine.Controller.ViewDelegation

  className: 'privateMessage modal'

  @type = "privateMessage"

  elements:
    ".validatable"    : "inputs_to_validate"
    "textarea"        : "message"

  events:
    "click .cancel"     :   "onClose"
    "click .send"       :   "onSend"

  constructor: ->
    super
    @html require("views/modals/privateMessage/layout")(@data.user)

  onSend: =>
    data = 
      text: @message.val()
      name: @data.user.username
      email: @data.user.email
      subject: "Private Message from #{Spine.user.username}"
      template: "privateMessage"
    
    post = $.post "/email/send" , data
    @el.addClass "waiting"
    post.success =>
      @el.removeClass "waiting"
      @onClose()
      
    post.error (a,b,error) ->
      @el.removeClass "waiting"
      @alert.html error
      @alert.addClass "alert-error"
      
  onClose: =>
    Spine.trigger "hide_modal"

module.exports = PrivateMessageModal
