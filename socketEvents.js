
var Socket = require("./socket");
var docker = require('./docker/dockerEvent');

var eventLists = function(io){
  io.on('connection', onConnect);
  // // force client disconnect from server
  io.on('forceDisconnect', function(socket) {
      socket.disconnect();
  })

  io.on('disconnect', function(socket) {
      console.log('user disconnected: ' + socket.name);
  });

};

var fs = require('fs');
var path = require('path');

function onConnect(socket){

  console.log("connected");
  var server = new Socket(socket);

  var file = function (server){
      server.listen('ReadFile', function(data, fn){
        // var file_path =  path.join(__dirname, "/chaincode/chaincode_test.js");
          var file_path =  path.join(__dirname, "/chaincode/fabcar/node/chaincode_test.js");
          var stats = fs.existsSync(file_path);
          var context = "";
          // console.log(file_path);
          // console.log(stats);
          if(stats){
            context = fs.readFileSync(file_path, 'utf8');
            // console.log(context);
          }else {
            fs.writeFile(file_path, "", 'utf8', function(err) {
              // console.log('비동기적 파일 쓰기 완료');
            });
          }
          fn({"path" : file_path, "context" : context});

			});
      server.listen('WriteFile', function(data, fn){
          if(data.path && data.context){
            fs.writeFile(data.path, data.context, 'utf8', function(err) {
              // console.log('비동기적 파일 쓰기 완료');
              if(err) return fn("error");
              fn("success");
            });
          }

      });

  };

  var blockchain = function(server){
    server.listen('RunChainCode', function(id, fn){
      var container = docker.container;
      // console.log(id);
      var command = "Your Command";
      container.exec(id, command, fn);
    });

    server.listen('UpgradePeer', function(id, fn){
      var container = docker.container;
      // console.log(id);
      var command = "Your Command";
      container.exec(id, command, fn);
    });
    
    // function ExecDocker(id, callback){
    //   var container = docker.container;
    //   // console.log(id);
    //   var command = "Your Command";
    //   container.exec(id, command, callback);
    // }


  }

  var container = function(server){
    server.listen('GetContainers', function(data, fn){
      var container = docker.container;
      container.getAllLists({all : true}).then(fn);

    });
    server.listen('StartLogging', function(id){
      var container = docker.container;
      // var id = process.env["CLI"];
      // var id = "48ed20942f2f";
      // container.exec(req.body.Id, req.body.cmd);
      console.log(id);
      // var command = "Your Command";
      container.logs(id, (data)=>{
        server.sendEvent("LogsResults", data);
      });
      // fn(true);
    });
    // server.listen('StopLogging', function(id){
    //   var container = docker.container;
    //   // var id = process.env["CLI"];
    //   // var id = "48ed20942f2f";
    //   // container.exec(req.body.Id, req.body.cmd);
    //   console.log(id);
    //   // var command = "Your Command";
    //   container.stopLog(id);
    //   // fn(true);
    // });
  }
  file(server);
  blockchain(server);
  container(server);
}

module.exports = eventLists;
