/********************************************************************************************
 * MODULES
 *******************************************************************************************/
var app = require("express").createServer(),    // Express module.
    sys = require("sys"),                       // SYS module
    //url = require("url"),                     // URL module
    //qs = require("querystring"),              // QUERYSTRING module
    Client = require("mysql").Client,         // MySQL module
    http = require("http");                     // HTTP module (http server and client)


/********************************************************************************************
 * GOLBALS
 *******************************************************************************************/
var HOST = "0.0.0.0";
var PORT = 8124;
var DB = initDB({
  user: "root",
  password: "cleo31",
  port: "/Applications/MAMP/tmp/mysql/mysql.sock",
  database: "voting_development"
});


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
    var participants = callbacks[active_poll.id] || [];
    var data_source = '/' + active_poll.id + '.json';
    
    var pollster = http.createClient(3000, HOST);
    var pollster_req = pollster.request('GET', data_source);
    pollster_req.end();
    
    log("AP(" + active_poll.id + ") : Set Q: " + active_poll.question_id);
    
    var data = {};
    DB.query(
      "SELECT body FROM questions WHERE (id = " + active_poll.question_id + ")",
      function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }
        
        data.question = results.pop().body;
        
        DB.query(
          "SELECT id, body FROM answers WHERE question_id = " + active_poll.question_id,
          function selectCb(err, results, fields) {
            if (err) {
              throw err;
            }

            data.answers = results;
            console.log(data);
            
            while (participants.length > 0) {
              request = participants.shift();
              request.callback(data);
              log("Responding (" + request.user + "), Q = " + active_poll.question_id);
            }
          }
        );
      }
    );
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

/**
 * Init Database Connection
 */
function initDB (options) {
  dbClient = new Client(options);
  dbClient.connect();
  dbClient.useDatabase(options.database);
  return dbClient;
}