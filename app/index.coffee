require('lib/setup')

Spine = require('spine')
Header = require('controllers/header')
ContactForm = require('controllers/contactForm')


class App extends Spine.Controller

  elements:
    ".header" : "header"
    ".contactFormWrapper" : "contactFormWrapper"

  constructor: ->
    super
    
    new Header(el: @header)
    new ContactForm(el: @contactFormWrapper)

    
    #@html require("views/layout")

module.exports = App
    