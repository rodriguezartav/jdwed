

class Routes

  constructor: (@app) ->    
    @setupRoutes()
    
  setupRoutes: ->
   #ROUTES GO HERE
    @app.get "/", (req,res) ->
      res.render "index" 

    @app.get "/hack-a-day", (req,res) ->
      res.render "hackaday" 
      
    @app.get "/hack-a-day/prepare", (req,res) ->
      res.render "prepare"
   

module.exports = Routes
   