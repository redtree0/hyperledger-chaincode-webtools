

  var path = require("path");
  var Docker = require("./docker");

  var os = require("os");


  function getServerIp() {
      var ifaces = os.networkInterfaces();
      var result = '';
      for (var dev in ifaces) {
          var alias = 0;
          if(dev === "eth0"){
            ifaces[dev].forEach(function(details) {
              if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
                ++alias;
              }
            });
          }
      }

      return result;
  }



  var Common = function( docker){
    this.docker = docker; /// docker modem 겍체 설정
    this.getInfo = null; /// docker get method 설정
    this.getLists = null; /// docker getlists method 설정
    this.attr = null; /// docker key attr 설정
    this.remoteDocker = null; /// 원격 docker 설정
  };

  (function(){ //// this =  p.prototype
    var self = this;

    /** @method  - successCallback
    *  @description promise 성공 시 callback
    *  @param {Function} callback - 콜백 함수
    *  @param {Object} data - promise 데이터
    *  @return {Function} callback - 콜백 함수
    */
    self.successCallback = function (callback, data){
      console.log("success");
      // console.log(arguments);
      // console.log(data);
      var result = {
        "state" : true,
        "statusCode" : 200,
        "msg" : data
      };
      return callback(result);
    };

    /** @method  - failureCallback
    *  @description promise 실패 시 callback
    *  @param {Function} callback - 콜백 함수
    *  @param {Object} data - promise 데이터
    *  @return {Function} callback - 콜백 함수
    */
    self.failureCallback = function (callback, err){
      console.log("failed");
      console.log(err);
      var result = {
        "state" : false ,
        "statusCode" : err.statusCode,
        "msg" : err.json.message,
        "error" : err.reason
      }
      return callback(result);
    };

    /** @method  - get
    *  @description 실행할 Promise를 GET함
    *  @param {Object} data - promise 데이터
    *  @param {Object} opts - docker 실행 시 필요한 옵션
    *  @param {String} method - docker에서 실행할 메소드
    *  @return {Array} lists - Promise Array
    */
    self.get = function (data, opts, method) {
      var self = this;
      var hasOpts = true;
      var hasGetInfo = false;
      if(self.hasOwnProperty("getInfo")){
        hasGetInfo = true;
      }
      if(arguments.length === 2) {
        method = opts;
        opts = null;
        hasOpts = false;
      }
      var list = [];
      var dockerInfo = null;
      // console.log(data);
      for(var i in data) {
        if(hasGetInfo){  /// getInfo 있는지 여부
          // console.log(data[i]);
          dockerInfo = self.docker[self.getInfo](data[i][(self.attr)]);
        }else {
          return ;
        }
        if(hasOpts){ /// opts 있는지 여부
          list.push( new Promise(function (resolve, reject) {
            resolve(dockerInfo[method](opts) );
          }));
        }else {
          list.push( new Promise(function (resolve, reject) {
            resolve(dockerInfo[method]() );
          }));
        }
      };
      return list;
    };

    /** @method  - dockerPromiseEvent
    *  @description Promise 실행한다. 이때 전부 성공 시  Event는 successCallback, 하나 이상의 실패가 발생 시 failureCallback
    *  @param {Object} promiselist - 실행할 promise 목록
    *  @param {Function} callback - client로 보낼 콜백함수
    *  @return {Object} Promise
    */
    self.dockerPromiseEvent = function(promiselist, callback) {
        var self = this;
        // return Promise.all(promiselist).then(self.successCallback.bind(null, callback) , self.failureCallback.bind(null, callback));
        return Promise.all(promiselist).then(self.successCallback.bind(self, callback) , self.failureCallback.bind(self, callback));
    }


    /** @method  - doTask
    *  @description parameter에 따라 get 과 dockerPromiseEvent를 호출한다.
    *  @param {Object} data - 실행할 promise 목록
    *  @param {Function} callback - client로 보낼 콜백함수
    *  @param {Object} opts - docker 실행 시 필요한 옵션
    *  @param {String} method - 실행할 메소드
    *  @return {Function} callback - client로 보낼 콜백함수
    */
    self.doTask = function(data, callback, opts, method){
      var self = this ;

      var promiseList = null;
      if(arguments.length === 3){
        method = opts;
        opts = null;
        promiseList = self.get(data, method);
      }else {
        promiseList = self.get(data, opts, method);
      }
      return self.dockerPromiseEvent(promiseList, callback);
    };

    /** @method  - getAllLists
    *  @description self.getLists 와 opts에 따라 promise 생성 후 리턴
    *  @param {Object} opts - docker 실행 시 필요한 옵션
    *  @param {Function} callback - client로 보낼 콜백함수
    *  @return {Function} callback - res로 보낼 콜백함수
    */
    self.getAllLists = function (opts, successCallback, failCallback, remoteDocker){
      var self = this;
      var docker = null;
      if(remoteDocker !== null && remoteDocker !== undefined){
        docker = remoteDocker;
      }else {
        docker = self.docker;
      }
      // console.log(docker);
      if(self.getLists !== null){
        var dockerInfo = docker[self.getLists](opts);
        return new Promise(function(resolve, reject){
          resolve(dockerInfo);
        }).then(successCallback, failCallback);
      }else {
        return;
      }


    };


    var serverIp = getServerIp();



    /** @method  - ping
    *  @description docker host ping test
    *  @param {Object} data - 설정 데이터
    *  @param {Function} callback - 클라이언트로 보낼 callback
    */
    self.ping = function (docker, callback) {
          return docker.ping(callback);
    };


    /** @method  - getDocker
    *  @description docker modem 객체 GET
    *  @return {Object} docker modem 객체
    */
    self.getDocker = function () {
      var self = this;
      return self.docker;
    }

    /** @method  - getTastDocker
    *  @description docker modem 객체 GET
    *  @return {Object} docker modem 객체
    */
    self.getTaskDocker = function(host, callback){

        var self = this;
        var docker = null;
        if(host !== getServerIp()  && host !== "default") {

            mongo.docker.find({"ip" : host}, (result)=>{
              // console.log(result);
              if(result === null){
                docker = new Docker();
                return   callback(docker);
              }
              var opts = {
                "host" : result.ip,
                "port" : result.port
              }

              docker = new Docker(opts);
              // console.log(docker);
              return self.ping(docker, (err, data)=>{
                  if(err === null){
                    callback(docker);
                  }
              });
              // return callback(docker);
            });
        }else if(host === getServerIp() || host === null ) {

          docker = new Docker();
          return   callback(docker);
          // return self.ping(docker, (err, data)=>{
          //     if(err === null){
          //       callback(docker);
          //     }
          // });
        }
    }

  }).call(Common.prototype);

  var docker = new Docker();

  var common = new Common(docker);

  var Container = Object.create(common);

   (function(){
     var self = this;
     self.getInfo = "getContainer";
     self.getLists = "listContainers";
     self.attr = "Id";

     /** @method  - create
     *  @description docker container 생성
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Object} docker.createContainer
     */
     self.create = function (data, callback) {
      //  console.log(data);
       return (self.docker).createContainer(data).then(self.successCallback.bind(self, callback) , self.failureCallback.bind(self, callback));
     }

     /** @method  - start
     *  @description docker container 시작
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.start  = function (data, callback) {
       return self.doTask(data, callback, "start");
     }

     /** @method  - stop
     *  @description docker container 멈춤
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.stop =  function (data, callback) {
       return self.doTask(data, callback, "stop");
     }

     /** @method  - remove
     *  @description docker container 삭제
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.remove = function (data, callback) {
       return self.doTask(data, callback, "remove");
     }

     /** @method  - kill
     *  @description docker container kill
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.kill = function (data, callback) {
       return self.doTask(data, callback, "kill");
     }

     /** @method  - getArchive
     *  @description docker container getArchive
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.getArchive = function (data, callback) {
       return self.doTask(data, callback, "getArchive");
     }

     /** @method  - pause
     *  @description docker container 정지
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.pause = function (data, callback) {
       return self.doTask(data, callback, "pause");
     }

     /** @method  - unpause
     *  @description docker container 정지 해제
     *  @param {Object} data - 설정 데이터
     *  @param {Function} callback - 클라이언트로 보낼 callback
     *  @return {Function} doTask
     */
     self.unpause = function (data, callback) {
       return self.doTask(data, callback, "unpause");
     }

    //  /** @method  - stats
    //  *  @description docker container stats GET
    //  *  @param {Object} data - 설정 데이터
    //  *  @param {Function} callback - 클라이언트로 보낼 callback
    //  *  @return {object} Promise
    //  */
    //  self.stats = function (data, callback) {
    //    var container = (self.docker).getContainer(data);
     //
    //    return new Promise(function (resolve, reject) {
    //      resolve(container.stats({"stream": false}));
    //    }).then(callback);
    //  }
     //
    //  /** @method  - top
    //  *  @description docker container top GET
    //  *  @param {Object} data - 설정 데이터
    //  *  @param {Function} callback - 클라이언트로 보낼 callback
    //  *  @return {object} Promise
    //  */
    //  self.top = function (data, callback){
    //    var container = (self.docker).getContainer(data);
    //    return new Promise(function (resolve, reject) {
    //      resolve(container.top ({"ps_args": "aux"}));
    //    }).then(callback);
    //  };
     //
    //  /** @method  - logs
    //  *  @description docker container logs GET
    //  *  @param {Object} data - 설정 데이터
    //  *  @param {Function} callback - 클라이언트로 보낼 callback
    //  *  @return {object} Promise
    //  */
    //  self.logs = function (data, callback){
    //    var container = self.docker.getContainer(data);
    //    return new Promise(function (resolve, reject) {
    //      //  "follow" : true, , "stderr": true
    //      container.logs ({ "stdout" : true}).then((data)=>{
    //        console.log(data);
    //      });
    //      resolve(container.logs ({ "stdout" : true}));
    //    });
    //  }
    self.exec = function(data, cmd, callback){
      var docker = self.docker;
      var container = docker.getContainer(data);
      console.log(container);
      console.log(cmd);

     var options = {
          Cmd: ["bash", "-c" , cmd],
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          DetachKeys: "ctrl-c",
          Tty : true
        };
     container.exec(options, function(err, exec) {
       console.log(err);
       console.log(exec);

        exec.start({hijack: true, stdin: true, Tty : true, Detach : false},function(err, stream) {
          if (callback && err) return callback("error");
          if (err) return;
          container.modem.demuxStream(stream, process.stdout, process.stderr);
          stream.on('end', function(){
            if(callback){
              callback(cmd + " done");
            }
          });
          exec.inspect(function(err, data) {
            if (err) return;
            console.log(data);
          });
          // console.log(err);
          // console.log(stream);
         });
     });
     //  });
    };

     self.attach = function(data, stdin, stdout, stderr){
       var docker = self.docker;
       var container = docker.getContainer(data);

      var options = {
           Cmd: ["/bin/bash"],
           AttachStdin: true,
           AttachStdout: true,
           AttachStderr: true,
           DetachKeys: "ctrl-c",
           Tty : true
         };
      container.exec(options, function(err, exec) {
         exec.start({hijack: true, stdin: true, Tty : true, Detach : false},function(err, stream) {
           //// exex stream attach에 넣기
            container.attach({hijack: true, stream: true, stdin: true, stdout: true, stderr: true}, function (err, Stream) {

              stderr(stream);
              stdin(stream, container);
              stdout(stream);
            });
          });
      });
      //  });
     };

     var stream = require('stream');
     var instance = null;
     self.logs = function(data, callback){


       var docker = self.docker;
       var container = docker.getContainer(data);
       var logStream = new stream.PassThrough();
       // console.log(container);
       logStream.on('data', function(chunk){
          // console.log("Called");
         // console.log(chunk.toString('utf8'));
         callback(chunk.toString('utf8'));
       });

       container.logs({
         follow: true,
         stdout: true,
         stderr: true,
          tail:1000,
       }, function(err, stream){
         if(err) {
           return logger.error(err.message);
         }


         container.modem.demuxStream(stream, logStream, logStream);
         stream.on('end', function(){
           logStream.end('!stop!');
         });

         if(instance == null){
           instance = stream;
         }
         setTimeout(function() {
           instance.destroy();
           instance = null;
         }, 2000);
       });
     }

     // self.stopLog = function(data, callback){
     //   if(instance != null){
     //     instance.destroy();
     //     instance = null;
     //   }
     // }


   }).call(Container);



   //
   var lists = {
     "container" : Container,

   }


module.exports = lists;
