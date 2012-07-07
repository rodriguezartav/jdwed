Emailer = require("./emailer");


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

    @app.post "/form" , (req,res) ->
      message = req.param 'message'
      name = req.param 'name'
      email = req.param 'email'
      Emailer.sendMail( 'Nombre:' + name + ' Email: ' + email + ' Mensaje: ' + message )
      res.send('{"response": "ok"}')

module.exports = Routes
   