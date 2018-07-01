var express = require('express');
var router = express.Router();

var docker = require('../docker/dockerEvent');

router.get('/run', function(req, res, next) {
  var container = docker.container;
  var chaincodeID = process.env["CHAINCODE"];

  // container.exec(req.body.Id, req.body.cmd);
  console.log(chaincodeID);
  var command = "CORE_CHAINCODE_ID_NAME='mycc:v0' node ./chaincode_test.js --peer.address peer:7052"
  container.exec(chaincodeID, command);

  res.send('Chaincode Running');
});

router.get('/peer/install', function(req, res, next) {
  var container = docker.container;
  var cliID = process.env["CLI"];
  // container.exec(req.body.Id, req.body.cmd);
  // var command = "peer chaincode upgrade -o orderer:7050 -C mycc:v0 -n mycc -v v1 -c '{\"Args\":[\"init\",\"a\", \"100\", \"b\",\"200\"]}'"
  var command = "peer chaincode install -l node  -n mycc -v 1 -p ./chaincode/chaincode_example02/node"
  container.exec(cliID, command);

  res.send('Chaincode install');

});

router.get('/peer/instantiate', function(req, res, next) {
  var container = docker.container;
  var cliID = process.env["CLI"];
  // container.exec(req.body.Id, req.body.cmd);
  // var command = "peer chaincode upgrade -o orderer:7050 -C mycc:v0 -n mycc -v v1 -c '{\"Args\":[\"init\",\"a\", \"100\", \"b\",\"200\"]}'"
  var command = "peer chaincode instantiate -n mycc -v v0 -c '{\"Args\":[\"init\",\"a\",\"100\",\"b\",\"200\"]}' -o orderer:7050 -C myc"
  container.exec(cliID, command);

  res.send('Chaincode instantiate');

});

router.get('/peer/update', function(req, res, next) {
  var container = docker.container;
  // container.exec(req.body.Id, req.body.cmd);
  var cliID = process.env["CLI"];
  var command = "peer chaincode upgrade -o orderer:7050 -n mycc -v 1 -c '{\"Args\":[\"init\",\"a\", \"100\", \"b\",\"200\"]}' -C mycc "
  // var command = "peer chaincode install -l node  -n mycc -v 1 -p ./chaincode/chaincode_example02/node"
  container.exec(cliID, command);

  res.send('Chaincode Update');

});
module.exports = router;
