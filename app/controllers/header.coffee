Spine = require('spine')

class Header extends Spine.Controller

  events:
    "click .primaryLinks" : "onLinkClick"

  constructor: ->
    super

  onLinkClick: (e) =>
    target = $(e.target)
    target = target.parents('li') if !target.hasClass("link")
    subnavName = target.attr "data-subnav"
    subnav = @el.find(".#{subnavName}") if subnavName
    subnav.show()
    setTimeout 3000 , (subnav) =>
      subnav.hide()

module.exports = Header
