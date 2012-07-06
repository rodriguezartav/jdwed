require('lib/setup')

Spine = require('spine')
Header = require('controllers/header')

class App extends Spine.Controller

  elements:
    ".header" : "header"

  constructor: ->
    super
    
    new Header(el: @header)
    
    #@html require("views/layout")

module.exports = App
    