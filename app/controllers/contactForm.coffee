Spine = require('spine')

class ContactForm extends Spine.Controller

  events:
    "submit form.contactForm"  : "onSubmit"

  elements:
    ".txtEmail"      : "txtEmail"
    ".txtName"       : "txtName"
    ".txtMessage"    : "txtMessage"
    ".errorMessage"  : "errorMessage"

  constructor: ->
    super

  validate: ->
    


  onSubmit: (e) =>
    e.preventDefault()

    post = $.post "/form" , message: @txtMessage.val() , name: @txtName.val() ,  email: @txtEmail.val()

    #post.success -> 
      #alert("second success")
      
    #post.error ->
      #alert("error")

    
    @html require("views/contactForm/afterSend")
        
  
    
module.exports = ContactForm
