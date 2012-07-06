

class Routes

  constructor: (@app) ->    
    @setupRoutes()
    
  setupRoutes: ->
   #ROUTES GO HERE
    @app.get "/", (req,res) ->
      res.render "index" 

    @app.get "/hack-a-day", (req,res) ->
      res.render "hackaday" 
      
    @app.get "/hack-a-day/preparese", (req,res) ->
      res.render "preparese"
   
    @app.get "/hack-a-day/app", (req,res) ->
      res.render "app"

module.exports = Routes
   