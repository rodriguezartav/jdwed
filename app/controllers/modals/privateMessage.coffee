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
    

  onClose: =>
    Spine.trigger "hide_modal"

module.exports = PrivateMessageModal
