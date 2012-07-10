nodemailer = require("nodemailer");

class Emailer

  constructor: (@app) ->
    @setupRoutes()

  setupRoutes:  =>

    @app.post "/tools/sendEmail" , (req, res) =>
      


  #create reusable transport method (opens pool of SMTP connections)
  @createTransport: =>
    @smtpTransport = nodemailer.createTransport "SMTP", 
      service: "Gmail",
      auth: 
        user: "webform@jungledynamics.com",
        pass: "jd123456"

  #setup e-mail data with unicode symbols
  @createMailOptions: (text) => 
    options=
      from: "Jungle Dynamics Web Site<webdyno@jungledynamics.com>",
      to: "webform@jungledynamics.com",
      subject: "Web Form Contact",
      text: text, 
      html: text

  @sendMail: (text) =>
    @createTransport()
    @smtpTransport.sendMail @createMailOptions(text) , (error, response) =>
      if error 
        console.log(error);
      else
        console.log("Message sent: " + response.message);
        @smtpTransport.close()

module.exports= Emailer