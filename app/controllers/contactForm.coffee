Spine = require('spine')
Contact = require('models/contact')

class ContactForm extends Spine.Controller
  @extend Spine.Controller.ViewDelegation

  events:
    "submit form.contactForm"  : "onSubmit"

  elements:
    ".validatable" : "inputs_to_validate"
    ".alert"       : "alert"

  constructor: ->
    super

  onSubmit: (e) =>
    e.preventDefault()
    contact = {}
    try
      @updateFromView(contact,@inputs_to_validate)
      Contact.create contact
      @html require("views/contactForm/afterSend")
    catch err
      @alert.addClass "alert-error"
      @alert.html require("views/errors/validationError")(err)

module.exports = ContactForm
