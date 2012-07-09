Spine = require('spine')

Spine.Controller.ViewDelegation =

  extended: ->

    @include

      validationErrors: []
    
      ##
      # Functions To Override 
      ##
      
      undelegateEvents: ->
        for key, method of @events
        
          match      = key.match(@eventSplitter)
          eventName  = match[1]
          selector   = match[2]

          if selector is ''
            @el.unbind(eventName, method)
          else
            @el.undelegate(selector, eventName, method)
      
      
      reset: () ->
        @undelegateEvents()
        @release()
        @customReset?()

      beforeSend: (object) ->
        return true

      customValidation: (object) ->
        return true

      ##
      # View Functions
      ##
      
      refreshView: (object,inputs) ->
        for input in inputs
          input = $(input)
          options = @getInputOptions(input)
          if options.dateName && object[options.type]
            date = new Date(object[options.type])
            input.val(date.getDate()) if options.datePart == "date"
            input.val(date.getMonth() + 1) if options.datePart == "month"
            input.val(date.getFullYear()) if options.datePart == "year"
          else if object[options.type]
            input.val( object[options.type] ) 

      updateFromView: (object,inputs) ->  
        @validationErrors= []   
        fechas = {}
        for input in inputs
          input = $(input) 
          options = @getInputOptions(input)
          errors  = @validate options 
          @validationErrors = @validationErrors.concat(errors) if errors.length > 0
          
          if options.numeric
            options.val = parseFloat(options.val)
          
          if options.dateName
            options.writable = false
            date = fechas[options.dateName] || {}
            date[options.datePart] = options.val
            fechas[options.dateName] = date

          object[options.type] = options.val if options.writable

        object = @parseDates(object,fechas)
        @customValidation(object)
        if @validationErrors.length > 0
          throw { type: "Error de Validacion" , errors: @validationErrors }
        
        @beforeSend(object)
        object.save?()
        return true 

      getInputOptions: (input) ->
        options = {}
        options.type = input.attr("data-type")
        options.min = input.attr("data-min-length") || 1
        options.maxValue = input.attr("data-max-value")  
        options.minValue = input.attr("data-min-value")  
        options.dateName = input.attr("date-name")
        options.datePart = input.attr("date-part")

        options.maxValue = parseFloat(options.maxValue) if options.maxValue
        options.minValue = parseFloat(options.minValue) if options.minValue


        options.writable = @toBool(input.attr("data-writable") || true)
        options.required = @toBool(input.attr("data-required") || true)
        options.numeric =  @toBool(input.attr("data-numeric") || false)
        options.positive = @toBool(input.attr("data-positive"))

        options.val = input.val() || ""

        options.positive = true if options.numeric and options.positive == null
        options.positive = false if options.positive == null
        options.min = 0 if !options.required

        options

      validate: (options) ->
        errors = []
        if options.val.length < options.min
          errors.push "Ingrese un valor para " + options.type
        else if isNaN(options.val) and options.numeric 
          errors.push "El campo " +  options.type + " campo debe ser numerico" 
        else if options.val < 0  and options.positive 
          errors.push "El campo " +  options.type + " campo debe ser positivo"
        else if options.maxValue != null and options.val > options.maxValue
          errors.push "El campo " +  options.type + " tiene como maximo #{options.maxValue}"
        else if options.minValue  != null and options.val < options.minValue
          errors.push "El campo " +  options.type + " tiene como minimo #{options.minValue}"
        errors
      
    ##
    # Utilities
    ##

      toBool: (string) ->
        return true if string == "true" or string == true
        return false if string == "false" or string == false
        return null


      resetDates: ->
        for input in @inputs_to_validate
          input = $(input) 
          options = @getInputOptions(input)
          if options.dateName
            date = new Date()
            input.val(date.getDate()) if options.datePart == "date"
            input.val(date.getMonth() + 1) if options.datePart == "month"
            input.val(date.getFullYear()) if options.datePart == "year"

      parseDates: (object,fechas) ->
        errors = []
        for index,fecha of fechas
          dateNum = new Date(fecha['year'],parseInt(fecha['month'])-1,fecha['date'])
          object[index] = dateNum
        return object

module?.exports = Spine.Controller.ViewDelegation

