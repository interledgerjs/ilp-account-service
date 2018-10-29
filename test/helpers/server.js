const PROTO_PATH = __dirname + '/../../src/proxy.proto';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// The protoDescriptor object has the full package hierarchy
const account = protoDescriptor.routeguide;

exports.create = function() {
  let server = new grpc.Server();
  server.addProtoService(account.Account.service, {
    AddAccount: addAccount,
  });
  return server;
}

function addAccount() {
  console.log("adding Account")
}

