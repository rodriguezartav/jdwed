sys     = require 'sys'


class Routes

  constructor: (@app) ->    
    @app.use @middleware()
    @setupRoutes()

  middleware: =>
    #load users before hand
    return (req,res,next)  =>
      return next() if req.method != "GET"
      req.parseController.kaiseki.getUsers (err, res, body) -> 
        console.log sys.inspect(err)
        req.users = body
        next()

  setupRoutes: ->
   #ROUTES GO HERE
    @app.get "/", (req,res) ->
      auth = req.session.authData  || null
      req.session.authData = null
      res.render "index" , { authData: JSON.stringify(auth) , users: JSON.stringify(req.users) }

    @app.get "/hack-a-day/:template?", (req,res) ->
      auth = req.session.authData || null
      req.session.authData = null
      template = req.params.template or "hackaday"
      res.render template , { authData: JSON.stringify(auth) , users: JSON.stringify(req.users) }

    @app.post "/email/send", (req,res) ->
      req.emailController.sendEmail "#{req.body.name} <#{req.body.email}>" , "#{req.body.subject}" , req.body.template , req.body.text ,  ->
        res.send(200,'')
     
    @app.post "/social/getFriends" , (req,res) ->
      req.twitterController.getFriendIDs req.body.user , req , (err,data,response) ->
        res(500,err) if err
        ids = data.ids
        if ids.length > 50
          start = req.body.offset or 0
          end = start + 50
          ids = ids.splice(start , end)
        
        req.twitterController.getUsers ids , req , ( err , data , response) ->
          res(500,err) if err
          results = []
          for dat in data
            results.push id: dat.id , name: dat.name , screen_name: dat.screen_name , description: dat.description
          res.send(results)

module.exports = Routes
   