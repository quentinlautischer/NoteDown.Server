var mongoose = require('mongoose');
var Account = require('../shared/models/account')
var Notes = require('../shared/models/notes')
var Image = require('../shared/models/image')
var Folder = require('../shared/models/folder')
var Page = require('../shared/models/page')

const net  = require('net');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

// var HOST = '127.0.0.1';
var HOST = "localhost"; // allows me to test on android
var PORT = 3000;

var DEBUG = false;

/******************************************************************************/
var express = require('express');
var http = require('http')
var socketio = require('socket.io');

var app = express();
var server = http.Server(app);
var websocket = socketio(server);
server.listen(PORT, HOST, () => console.log('listening on ' + HOST + ":" + PORT));


// The event will be called when a client is connected.
websocket.on('connection', (socket) => {
    console.log('A client just joined on', socket.id);

    socket.on('request-login', (data) => {
      loginRequest(socket, data);
    });

    socket.on('request-signup', (data) => {
      signupRequest(socket, data);
    });

    socket.on('request-pull-data', (data) => {
      pullDataRequest(socket, data);
    });

    socket.on('request-push-data', (data) => {
      pushDataRequest(socket, data);
    });

    socket.on('request-photo', (data) => {
      photoRequest(socket, data);
    });

    socket.on('request-photo-supply', (data) => {
      photoSupplyRequest(socket, data);
    });

    socket.on('request-photo-put', (data) => {
      photoPutRequest(socket, data);
    });

});

websocket.on('close', (socket) => {
  console.log('A client just closed on', socket.id);
});

db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function(){
});

serverPrint = function(title, callback) {
    console.log(`#############################################`);
    console.log(`### ${title}\n`)
    callback();
    console.log(`#############################################`);
}

/////////////////////////////////////////////
// User Account Requests

createAccountModel = function(email, password, name) {
  console.log(`Creating Account; Email: ${email}; Pass: ${password}; Name: ${name};`);
  var account = new Account({
    email: email,
    password: password,
    name: name,
    notes: this.createNotesModel(email)
  });
  return account;
}

createNotesModel = function(userid) {
  var notes = new Notes({
    userid: userid,
    folders: [],
    images: []
  });
  return notes;
}

printRegisteredUsers = function() {
  Account.find(function (err, results) {
    if (err) {
      console.log(`ServerError while printing Registered Users`)
    }
    this.serverPrint("REGISTERED USERS", () => {
      console.log(`Accounts: ${results}`);
    });
  });
}

loginRequest = function(socket, data) {
  console.log(`login-request from ${socket.id}; Username: ${data.username}; Password: ${data.password};`);

  if (DEBUG) {
    setTimeout(function() {
      console.log("sending login response");
      const event = {event: "request-login-response", data: {result: true, userid: "lautisch"}};
      socket.emit('data', event);
    }, 1);
    return;
  }

  Account.find({ email: data.username}, function (err, results) {
    if (err) {
      console.error(err);
      socket.emit('server-error', { msg: 'Server Encountered An Error' })
    }

    console.log('Accounts Found: ' + results);
    if (results.length && results[0].password == data.password) {
      const event = {event: "request-login-response", data: {result: true, userid: results[0].email}};
      socket.emit('data', event);
    } else {
      const event = {event: "request-login-response", data: {result: false, msg: "An account with that username and password does not exist"}};
      socket.emit('data', event);
    }

  });
}

signupRequest = function(socket, data) {
  console.log(`signup-request from ${socket}; Username: ${data.username} Password: ${data.password} Name: ${data.name}`);

  if (DEBUG) {
    setTimeout(function() {
      console.log("sending signup response");
      const event = {event: "request-signup-response", data: {result: true, userid: "lautisch"}};
      socket.write(JSON.stringify(event));
    }, 3000);
    return;
  }

  Account.find({ email: data.username}, function (err, results) {
    if (err) {
      console.error(err);
      socket.emit('server-error', { msg: 'Server Encountered An Error' })
    }

    console.log('Accounts Found: ' + results);
    if (!results.length) {
      var account = this.createAccountModel(data.username, data.password, data.name);

      account.save(function (err) {
        if (err) {
           console.error(`MongooseSaveError: ${err}`);
           socket.emit('server-error', { msg: 'Server Encountered An Error' });
        } else {
          const event = {event: "request-signup-response", data: {result: true, userid: account.email}};
          socket.emit('data', event);
          this.printRegisteredUsers();
        }
      });

    } else {
      const event = {event: "request-signup-response", data: {result: false, msg: "An account with that username already exists"}};
      socket.emit('data', event);
    }

  });
}

/////////////////////////////////////////////
// Sync Requests

pullDataRequest = function(socket, data) {
  console.log(`pull-data-request from user: ${data.userid}`);

  if (DEBUG) {
    var notes = new Notes({
      userid: "lautisch",
      folders: [
        new Folder({
          name: "Folder 1",
          pages: [
            new Page({
              content: "# Page 1 Content \n* Item 1\n* Item 2\n \n \n## Header 2 \n### Header 3\n#Header11\n"
            }),
            new Page({
              content: "Page 2 Content"
            }),
            new Page({
              content: "Page 3 Content"
            })
          ]
        }),
        new Folder({
          name: "Folder 2",
          pages: [
            new Page({
              content: "#H0\n#H1\n#H2\n#H3\n#H4\n#H5\n#H6\n#H7\n#H8\n#H9\n#H10\n#H11\n#H12\n#H13\n#H14\n#H15\n#H16\n#H17\n#H18\n#H19\n#H20\n#H21\n#H22\n#H23\n#H24\n#H25\n#H26\n#H27\n#H28\n#H29\n#H30\n#H31\n#H32\n#H33\n#H34\n#H35\n#H36\n#H37\n#H38\n#H39\n#H40\n#H41\n#H42\n#H43\n#H44\n#H45\n#H46\n#H47\n#H48\n#H49\n"
            })
          ]
        }),
      ],
      images: [new Image()]
    });
    const event = {event: "request-pull-data-response", data: {result: true, notes: notes}};
    socket.emit('data', event);
    return;
  }

  Account.find({ email: data.userid}, function (err, results) {
    if (err) {
      console.error(err);
      socket.emit('server-error', { msg: 'Server Encountered An Error' })
    }

    if (results.length) {
      const event = {event: "request-pull-data-response", data: {result: true, notes: results[0].notes}};
      socket.emit('data', event);
    } else {
      const event = {event: "request-pull-data-response", data: {result: false, msg: "No data was found for your account"}};
      socket.emit('data', event);
      this.printRegisteredUsers();
    }
  });
}

pushDataRequest = function(socket, data) {
  console.log(`push-data-request from user: ${data.userid}`);
  console.log(`push-data-request data: ${data.notes}`);
  console.log(`push-data-request folders: ${data.notes.folders}`);

  Account.findOneAndUpdate({ email: data.userid }, { notes: data.notes }, function (err, results) {
    if (err) {
      console.error(err);
      socket.emit('server-error', { msg: 'Server Encountered An Error' })
    } else {
      const event = {event: "request-push-data-response", data: {result: true}};
      socket.emit('data', event);

    }
  });
}

/////////////////////////////////////////////
// Photo Requests

photoRequest = function(socket, data) {
  console.log('photo-request');
}

photoSupplyRequest = function(socket, data) {
  console.log('photo-supply-request');
}

photoPutRequest = function(socket, data) {
  console.log('photo-put-request ' + data.photo);
}

console.log("server running");
printRegisteredUsers();
