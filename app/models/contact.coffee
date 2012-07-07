Spine = require('spine')

class Contact extends Spine.Model
  @configure 'Contact' , "name" , "email" , "message"
  
  
  
module.exports = Contact