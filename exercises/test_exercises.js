var config = require('./config');
var amqp = require('amqp');
var connection = amqp.createConnection(config, {reconnect: false});
var exchange

var cmds = ['save', 'read_exercises', 'remove']

connection.on('error', function(err) {
  console.log(err.stack)
})


connection.on('ready', function __connectionReady() {
  console.log('Connected to amqp://' + config.login + ':' + config.password + '@' + config.host + '/' + config.vhost);

  // Connect to exchange
  exchange = connection.exchange(config.exchangeName, config.exchange, function __exchangeReady(exchange) {
    console.log('Exchange \'' + exchange.name + '\' is open');
  });

  // Setup queue
  var queue = connection.queue('', config.queue, function __queueReady(queue) {

    // Bind queue to exchange
    queue.bind(exchange, '');

    remove_exercises(exchange)

    // Subscribe to messages on queue
    queue.subscribe(function __listener(message) {
      // NOTE: if the message was published by another node-amqp client,
      // message will be a plain JS object, if the message is published by other
      // clients it may be received as a Buffer, which you'll need to convert
      // with something like this:
      message = JSON.parse(message.data.toString('utf8'));
      console.log('RECEIVED', message)
      if (message.solutions.length > 0) {
        console.log('received solution\n\n' + JSON.stringify(message, null, 2))
      }
    });
  });
});

var save = function() {
  var cmd =  {need: 'exercises', cmd: 'save', solutions: [], exercise: {name: 'pushup', category: 'Body Weight', tags: ['Chest', 'Arms'], type: 'weight/reps', owner: 'dara'}}
  console.log('PUBLISHING MESSAGE\n' + JSON.stringify(cmd));
  exchange.publish('', JSON.stringify(cmd));
}


var read_exercises =  function() {
  var cmd = {need: 'exercises', cmd: 'read_exercises', solutions: []}
  console.log('\n' + JSON.stringify(cmd));
  exchange.publish('', JSON.stringify(cmd));
}

var remove_exercises = function() {
  var cmd = {need: 'exercises', cmd: 'remove', solutions: [], exercise: {id: '561cd9fb3632776a2e1f6a42'}}
  console.log('\n' + JSON.stringify(cmd));
  exchange.publish('', JSON.stringify(cmd))
}