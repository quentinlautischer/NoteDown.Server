var mongoose = require('mongoose');
var Account = require('./models/account')
var Notes = require('./models/notes')
var Image = require('./models/image')
var Folder = require('./models/folder')
var Page = require('./models/page')

const net  = require('net');

// mongoose.connect('mongodb://localhost/test');
mongoose.connect('mongodb://quentin:Lalaman123@ds141950.mlab.com:41950/heroku_n55zw4d8');
var db = mongoose.connection;

var redux = require('redux');
var reducer = require('./serverReducer');


const net  = require('net');

var HOST = '127.0.0.1';
// var HOST = "localhost"; // allows me to test on android
var PORT = 3000;

var DEBUG = false;

const store = redux.createStore(reducer.serverReducer);

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

    socket.on('close', (data) => {
      console.log(`A client just closed with socket id ${socket.id}`);
      serverPrintState();
      store.dispatch({type: 'REMOVE_ONLINE_USER', socketid: socket.id});
      serverPrintState();
    });

    socket.on('disconnect', (data) => {
      console.log(`A client just disconnected with socket id ${socket.id}`);
      serverPrintState();
      store.dispatch({type: 'REMOVE_ONLINE_USER', socketid: socket.id});
      serverPrintState();
    });
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

serverPrintState = function() {
  console.log(`State: ${JSON.stringify(store.getState())}`)
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
    updatedAt: ""
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

findUser = function(action) {
  var onlineUsers = store.getState().onlineUsers;
  console.log(`Online Users: ${JSON.stringify(onlineUsers)}`);
  onlineUsers = onlineUsers.filter(function(user) {return user.platform == action.platform});
  console.log(`Online Users (platform filter: ${action.platform}): ${JSON.stringify(onlineUsers)}`);
  if (action.type == 'socket') {
    onlineUsers = onlineUsers.filter(function(user) {return user.socketid == action.socket});
    console.log(`Online Users (socket filter): ${JSON.stringify(onlineUsers)}`);
  } else if (action.type == 'userid') {
    onlineUsers = onlineUsers.filter(function(user) {return user.userid == action.userid});
    console.log(`Online Users (user filter): ${JSON.stringify(onlineUsers)}`);
  }
  if (onlineUsers.length == 1) {
    return onlineUsers[0];
  } else {
    return null;
  }
}
loginRequest = function(socket, data) {
  console.log(`login-request from ${socket.id}; Username: ${data.username}; Password: ${data.password};`);

  Account.find({ email: data.username}, function (err, results) {
    if (err) {
      console.error(err);
      socket.emit('server-error', { msg: 'Server Encountered An Error' })
    }

    console.log('Accounts Found: ' + results);
    if (results.length && results[0].password == data.password) {
      const event = {event: "request-login-response", data: {result: true, userid: results[0].email}};
      socket.emit('data', event);
      serverPrintState();
      store.dispatch({type: 'ADD_ONLINE_USER', userid: results[0].email, socketid: socket.id, platform: data.platform});
      serverPrintState();
    } else {
      const event = {event: "request-login-response", data: {result: false, msg: "An account with that username and password does not exist"}};
      socket.emit('data', event);
    }

  });
}

signupRequest = function(socket, data) {
  console.log(`signup-request from ${socket}; Username: ${data.username} Password: ${data.password} Name: ${data.name}`);

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
  console.log(`push-data-request (forced push?: ${data.force_push}) from user: ${data.userid}`);
  console.log(`push-data-request data: ${data.notes}`);

  Account.find({ email: data.userid}, function (err, results) {
    if (err) {
      console.error(err);
      socket.emit('server-error', { msg: 'Server Encountered An Error' })
    }
    if (results.length) {
      console.log(results[0]);
      console.log(`User Update Time: ${data.notes.updatedAt} Server Update Time: ${results[0].notes.updatedAt.toISOString()}`);
      if (data.force_push || data.notes.updatedAt == results[0].notes.updatedAt.toISOString()) {
        // No other push occurred.
        console.log("no push conflict");
        var date = new Date();
        data.notes.updatedAt = date.toISOString();
        Account.findOneAndUpdate({ email: data.userid }, { notes: data.notes }, function (err, results) {
          if (err) {
            console.error(err);
            socket.emit('server-error', { msg: 'Server Encountered An Error' })
          } else {
            console.log("Push Data success");
            const event = {event: "request-push-data-response", data: {result: true}};
            socket.emit('data', event);
          }
        });
      } else {
        // Another push occurred user needs to choose.
        console.log("Push Data Conflict");
        const event = {event: "request-push-data-response", data: {result: false, type: 'push-conflict', msg: 'Push Conflict'}};
        socket.emit('data', event);
      }
      
    } else {
      const event = {event: "request-push-data-response", data: {result: false, type: 'error', msg: 'Could not find account'}};
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
  console.log(`photo-put-request from socket: ${socket.id}`);
  var putUser = findUser({type: 'socket', socket: socket.id, platform: 'mobile'});
  if (putUser) {
    console.log(`Put-User found ${putUser.userid}`);
  } else {
    console.log('Put-User not found.');
    return;
  }

  var supplyUser = findUser({type: 'userid', userid: putUser.userid, platform: 'desktop'});
  if (supplyUser){
    console.log(`Found supply user desktop socket`);

    const event = {event: "photo-supply-request", data: {photo: data.photo}};
    websocket.to(supplyUser.socketid).emit('data', event);
    console.log('Emitted Photo data');
  } else {
    console.log(`Supply-User not found`);
  }
}

console.log("server running");
printRegisteredUsers();
