Spine = require('spine')

class Header extends Spine.Controller

  events:
    "click .primaryLinks" : "onLinkClick"

  elements:
    ".subnav" : "subnav"

  constructor: ->
    super

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
