'use strict';

$(function(){

    const DOMAIN = "http://192.168.137.17";
    var socket = io.connect(DOMAIN +':8080');


    init();
    DockerHandler();

    function init(){

        var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
         lineNumbers: true,
         mode: "javascript"
       });


        var chaincode_path =  document.getElementById("chaincode_path");


        LoadFile();
        LoadContainers();
        ClickLogsBtn();
        ClickSaveBtn();

        function LoadFile(){
          socket.emit('ReadFile', "", function (data) {
             console.log(data);
             chaincode_path.value = data.path;
             editor.setValue(data.context);
          });
        }


          function ClickLogsBtn(){

              var $log_btn = $('#logs');
              var $footer = $("footer");
              $log_btn.click(function(){
                  if($footer.is(":visible")){
                     $footer.hide(10000);
                      }else {
                    $footer.show(10000)
                  }
              });

          }

          function ClickSaveBtn(){
              var save_btn = document.getElementById("save");
              save_btn.onclick = function() {
                  var data = {
                    path : chaincode_path.value,
                    context : editor.getValue()
                  }
                  socket.emit('WriteFile', data, function (data) {
                     console.log(data);
                  });

              };
          }


          function LoadContainers(){
            var containerlists = [];
            socket.emit('GetContainers', "", function (data) {

                 containerlists = data;

                 containerlists.forEach((c)=>{
                     $("#logmenu").append('<a href="#" class="list-group-item container" data-parent="#logmenu" id='+ c.Id +'>'+JSON.stringify(c.Names) +"</a>" );
                 });
            });
          }

    };



    function DockerHandler(){

          var containerId = null;
          Logging();
          ClickChainCodeBtn();
          ClickUpgradeBtn();

         function Logging(){
           socket.on('LogsResults', function(data){
             // console.log(data);
             $LogOutput.html( $LogOutput.html() + data+ "<br/>");
           });

           var $LogOutput = $("#LogOutput");
           $('#logmenu').on("click", "a.container", function(event) {
             $LogOutput.html("");
             console.log("Clicked");
             containerId =  event.target.id;
             socket.emit('StartLogging', event.target.id, function (data) {

                console.log(data);
                // console.log($("#LogOutput").text());
             });
           });

         }

         function ExecDocker(eventName){
            // var opts ={
            //    id : id,
            //    // cmd : cmd
            //  };

             socket.emit(eventName, containerId, function (data) {
               console.log(data);
             });

         }

         function ClickChainCodeBtn(){

           var chaincode_btn = document.getElementById("chaincode_run");
           chaincode_btn.onclick = function() {
             console.log("clicked");
             console.log(containerId);
               if(containerId != null){
                 ExecDocker("RunChainCode");
               }
            };
         }

         function ClickUpgradeBtn(){
           var peer_btn = document.getElementById("peer_upgrade");
           peer_btn.onclick = function() {
               if(containerId != null){
                 ExecDocker("UpgradePeer");
               }
            };
         }

    };



   });
