Spine = require('spine')
#ADD ON FOR A MODEL THAT MUST BE A SINGLETON AND LOCAL , LIKE FOR SESSION AND OPTIONS

class Spine.SingleModel extends Spine.Module
  @extend Spine.Events

  @attributes: []

  @record: null

  @configure: (name, attributes...) ->
    @className  = name
    @attributes = attributes if attributes.length
    @attributes and= makeArray(@attributes)
    @unbind()
    this

  @create: (atts = {}) ->
    record = new @(atts)
    @record = record
    record

  @save: ->
    result = JSON.stringify(@record)
    localStorage[@className] = result
    @record
      
  @fetch: ->
    result = localStorage[@className]
    result = "{}" if result == undefined or result == null
    @record = @create(JSON.parse(result))
    for index,value of @record
      testDate = new Date(value)
      @record[index] = testDate if testDate.getTime() > 0
    @record

  @change: (callbackOrParams) ->
    if typeof callbackOrParams is 'function'
      @bind('change', callbackOrParams)
    else
      @trigger('change', callbackOrParams)

  constructor: (atts) ->
    super
    @load(atts) if atts
  
  load: (atts) ->
    for key, value of atts
      if typeof @[key] is 'function'
        @[key](value)
      else
      @[key] = value
    this

  save: ->
    @constructor.save()

  makeArray = (args) ->
    Array.prototype.slice.call(args, 0)


module.exports = Spine.SingleModel
