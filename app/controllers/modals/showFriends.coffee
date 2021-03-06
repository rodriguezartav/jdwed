Spine   = require('spine')
$       = Spine.$

class ShowFriends extends Spine.Controller
  @extend Spine.Controller.Modal
  
  className: 'showFriends modal'

  @type = "showFriends"

  elements: 
    ".nav" : "list"

  events:
    "click .close" : "onClose"
    "click .more"  : "onLoadmore"

  constructor: ->
    super
    @html require("views/modals/showFriends/layout")
    @friends = []
    @loadFriends()

  loadFriends: (offset=0) =>
    @lastOffset = offset
    
    params=
      data:
        user: @data.user.username
        twitter: Spine.user.authData.twitter
        offset: offset
      url: "/social/getFriends"

    Spine.AjaxUtil.custom("POST", params, success: @onSuccess , error: @onError)

    @el.addClass "waiting"
   
  onSuccess: (data) =>
    @render(data)
  
  onError: (a,b,error) ->
    console.log error

  render: (response) =>
    @el.removeClass "waiting"
    @friends = @friends.concat response

    @list.html require("views/modals/showFriends/item")(@friends)
    @list.append require("views/modals/showFriends/item")({name: "more"})

    @list.find(".popable").popover()

  onLoadmore: (e) ->
    target = $(e.target)
    li = target.parents "li"
    a = target.find "a"

    name = li.attr "data-data"
    if name == "more"
      @loadFriends(@lastOffset + 50)
    
  onClose: =>
    Spine.trigger "hide_modal"

module.exports = ShowFriends
