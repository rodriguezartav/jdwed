require('lib/setup')
Spine = require('spine')

#modals
UserRegistrationModal = require("controllers/modals/userRegistration")
PrivateMessageModal   = require("controllers/modals/privateMessage")
ShowFriendsModal   = require("controllers/modals/showFriends")


Header = require('controllers/header')
ContactForm = require('controllers/contactForm')
SocialBar = require('controllers/socialBar')

CurrentUser = require('models/currentUser')
User = require('models/user')

class App extends Spine.Controller
  @extend Spine.Controller.ModalController

  elements:
    ".header"                :  "header"
    ".contactFormWrapper"    :  "contactFormWrapper"
    ".socialBar"             :  "socialBar"

  constructor: ->
    super
    @setupModal()

    new Header(el: @header)
    new ContactForm(el: @contactFormWrapper)
    new SocialBar(el: @socialBar)

    CurrentUser.bind "save" , CurrentUser.afterSave
    CurrentUser.fetch()

    if @authData
      CurrentUser.logout()
      Spine.trigger "show_modal" , "userRegistration" , action: "create" , authData: @authData

    if @users
      users = @users
    User.refresh(users)

    $('.popable').popover({placement: "bottom"})
        

    
  onSuccess: (data) ->
    console.log data
    
  onError: ->
    console.log arguments
    

module.exports = App