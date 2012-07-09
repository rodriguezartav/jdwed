Redis = require("redis")

class RedisController
  @redis = null

  if (process.env.REDISTOGO_URL) 
    rtg   = require("url").parse(process.env.REDISTOGO_URL);
    @redis = Redis.createClient(rtg.port, rtg.hostname);
    @redis.auth(rtg.auth.split(":")[1]);
  else
    @redis = Redis.createClient();


  @redis.on "error", (msg) ->
      console.log msg

    
module.exports =  RedisController