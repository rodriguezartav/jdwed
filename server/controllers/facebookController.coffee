oauth   = require 'oauth'
sys     = require 'sys'
winston = require 'winston'

class TwitterController

  constructor: (@app) ->
    @consumerKey= process.env.TWITTER_consumerKey
    @consumerSecret= process.env.TWITTER_consumerSecret
    @baseURL= process.env.TWITTER_baseURL

    @consumer = new oauth.OAuth(
      "https://www.facebook.com/dialog/oauth","https://graph.facebook.com/oauth/access_token",
      @consumerKey, @consumerSecret
      "1.0A", "#{@baseURL}/conexion/twitter/callback", "HMAC-SHA1")

    @setupRoutes()

  setupRoutes:  =>

    @app.get "/sessions/facebook/login" , (req, res) =>
      req.session.lastView = req.query.lastView

      @consumer.getOAuthRequestToken (error, oauthToken, oauthTokenSecret, results) ->
        if error
          return TwitterController.sendError req, res, "Error getting OAuth request token : " + sys.inspect(error), 500
        else
          req.session.oauthRequestToken = oauthToken
          req.session.oauthRequestTokenSecret = oauthTokenSecret
          return res.redirect "https://twitter.com/oauth/authorize?oauth_token=#{req.session.oauthRequestToken}"

    @app.get '/conexion/twitter/callback', (req,res) =>
      @consumer.getOAuthAccessToken req.session.oauthRequestToken, req.session.oauthRequestTokenSecret , req.query.oauth_verifier ,
        (err, oauthAccessToken, oauthAccessTokenSecret, results) ->

          if err
            TwitterController.sendError req, res, "Error getting OAuth access token : #{sys.inspect(err)}" +
              "[#{oauthAccessToken}] [#{oauthAccessTokenSecret}] [#{sys.inspect(results)}]" 

          if results
            req.session.authData =
              twitter:
                id: results.user_id
                screen_name: results.screen_name
                auth_token: oauthAccessToken
                auth_token_secret: oauthAccessTokenSecret
                consumer_key: process.env.TWITTER_consumerKey
                consumer_secret: process.env.TWITTER_consumerSecret
          
            req.session.oauthRequestToken = null
            req.session.oauthRequestTokenSecret = null
            res.redirect "/"

  ##############################################################################
  # SERVICES CALLS CALLS
  ##############################################################################

  @sendError: (req,res,err) ->
    if err
      if process.env['NODE_ENV']=='development'
        res.send "Login error: #{err}", 500
      else
        res.send '<h1>Sorry, a login error occurred</h1>', 500
    else
      res.redirect '/' # todo

  get: (url, req, callback) ->
    callback 'no twitter session' unless req.user.twitter?
    @consumer.get url, req.user.twitter.accessToken, req.user.twitter.accessTokenSecret,
    (err, data, response) ->
      callback err, data, response

  getJSON: (apiPath, req, callback) ->
    callback 'no twitter session' unless req.user.twitter?
    @consumer.get "http://api.twitter.com/1#{apiPath}", req.user.twitter.accessToken, req.user.twitter.accessTokenSecret,
    (err, data, response) ->
      callback err, JSON.parse(data), response

  post: (url, body, req, callback) ->
    callback 'no twitter session' unless req.user.twitter?
    @consumer.post url, req.user.twitter.accessToken, req.user.twitter.accessTokenSecret, body,
    (err, data, response) ->
      callback err, data, response

  postJSON: (apiPath, body, req, callback) ->
    callback 'no twitter session' unless req.user.twitter?
    url = "http://api.twitter.com/1#{apiPath}"
    @consumer.post url, req.user.twitter.accessToken, req.user.twitter.accessTokenSecret, body,
    (err, data, response) ->
      callback err, JSON.parse(data), response

  ##############################################################################
  # SPECIFIC CALLS
  ##############################################################################

  
module.exports = TwitterController
