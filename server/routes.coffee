Emailer = require("./emailer");
TwitterController = require('./twitterController')

class Routes

  constructor: (@app) ->    
    @setupRoutes()
    @twitterController = new TwitterController(@app)
    
    
  setupRoutes: ->
   #ROUTES GO HERE
    @app.get "/", (req,res) ->
      auth = req.session.authData  || null
      req.session.authData = null
      res.render "index" , { authData: JSON.stringify(auth) }

    @app.get "/hack-a-day", (req,res) ->
      auth = req.session.authData || null
      req.session.authData = null
      template = "hackaday"
      res.render template , { authData: JSON.stringify(auth) }

    @app.get "/hack-a-day/:template", (req,res) ->
      auth = req.session.authData || null
      req.session.authData = null
      template = req.params.template
      res.render template , { authData: JSON.stringify(auth) }

    @app.post "/form" , (req,res) ->
      message = req.param 'message'
      name = req.param 'name'
      email = req.param 'email'
      Emailer.sendMail( 'Nombre:' + name + ' Email: ' + email + ' Mensaje: ' + message )
      res.send('{"response": "ok"}')

module.exports = Routes
   