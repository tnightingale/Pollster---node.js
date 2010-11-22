/********************************************************************************************
 * MODULES
 *******************************************************************************************/
var app = require("express").createServer(),    // Express module.
    sys = require("sys");                       // SYS module
    //url = require("url"),                     // URL module
    //qs = require("querystring"),              // QUERYSTRING module
    //http = require("http"),                   // HTTP module (http server and client)
    //Client = require("mysql").Client,         // MySQL module

var HOST = "0.0.0.0";
var PORT = 8124;


/********************************************************************************************
 * INITIALIZE SERVER
 *******************************************************************************************/
app.enable('jsonp callback');

app.get('/query_active_question', function(req, res) {
  active_polls.query(req.socket.fd, req.query.active_poll, function (data) {
    res.send(data);
  });
});

app.get('/set_question', function(req, res) {
  active_polls.set_question(req.query);
  res.send({});
});

app.listen(PORT, HOST);


/********************************************************************************************
 * ACTIVE_POLL HANDLER
 *******************************************************************************************/
var active_polls = new function () {
  var callbacks = [];
  
  this.set_question = function (active_poll) {
    participants = callbacks[active_poll.id] || [];
    log("AP(" + active_poll.id + ") : Set Q: " + active_poll.question_id);
    
    while (participants.length > 0) {
      request = participants.shift();
      log("Responding (" + request.user + "), Q = " + active_poll.question_id);
      request.callback(active_poll);
    }
  }
  
  this.query = function (user, req_active_poll, callback) {
    callbacks[req_active_poll] = callbacks[req_active_poll] || [];
    
    request = { user: user, timestamp: new Date(), callback: callback };
    callbacks[req_active_poll].push(request);
    
    log("User " + user + " request pushed.");
  };
};


/********************************************************************************************
 * HELPER FUNCTIONS
 *******************************************************************************************/
function log(message) {
  sys.puts(new Date() + ": " + message);
}