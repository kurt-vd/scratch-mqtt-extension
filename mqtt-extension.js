/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

(function(ext) {

  $.getScript("https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.js", function( data, textStatus, jqxhr ) {
  console.log( data ); // Data returned
  console.log( textStatus ); // Success
  console.log( jqxhr.status ); // 200
  console.log( "Load was performed." );
  });

  console.log( "another log" ); // 200
  $.getScript("https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js", function(){});

  var mqtt;
  var reconnectTimeout = 2000;
  var messagePayload = '';
  var messageTopic = '';
  var messageQueue = [];

  host = 'server';
  port = 1883;
  topic = 'scratch';		// topic to subscribe to
  useTLS = false;
  username = null;
  password = null;
  cleansession = true;

  console.log("timeout=" + reconnectTimeout);


  function MQTTconnect() {

    if (typeof path == "undefined") {
      path = '';
      console.log("path=" + path);
    };


    mqtt = new Paho.MQTT.Client(
      host,
      port,
      "web_" + parseInt(Math.random() * 100, 10)
    );

    var options = {
      timeout: 3,
      useSSL: useTLS,
      cleanSession: cleansession,
      onSuccess: onConnect,
      onFailure: function (message) {
          $('#status').val("Connection failed: " + message.errorMessage + "Retrying");
          setTimeout(MQTTconnect, reconnectTimeout);
    }
  };

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;

    if (username != null) {
        options.userName = username;
        options.password = password;
    }
    console.log("Host="+ host + ", port=" + port + ", path=" + path + " TLS = " + useTLS + " username=" + username + " password=" + password);
    mqtt.connect(options);
  }



    function onMessageArrived(message) {
        console.log("message arrived " + message.payloadString);
        messageQueue.push(message);
    };

    function onConnect() {
        console.log("trying to connect");
        $('#status').val('Connected to ' + host + ':' + port + path);
        // Connection succeeded; subscribe to our topic
        mqtt.subscribe(topic, {qos: 0});
        $('#topic').val(topic);

    };


    function onConnectionLost(response) {
        setTimeout(MQTTconnect, reconnectTimeout);
        $('#status').val("connection lost: " + response.errorMessage + ". Reconnecting");
    };


    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.set_url = function(_host) {
      host = _host;
    };

    ext.set_topic = function(_topic) {
      topic = _topic;
    };

    ext.set_port = function(_port) {
      port = _port;
    };


    ext.connect = function() {
      MQTTconnect();
    };

    ext.set_TLS = function(_useTLS) {
      if ( _useTLS == "true") {
        useTLS = true;
      };
      if ( _useTLS == "false") {
        useTLS = false;
      };
    };

	ext.get_message = function() {
		return messagePayload;
	}
	ext.get_topic = function() {
		return messageTopic;
	}

    ext.send_message = function(message) {
      //console.log("trying to published message");
      mqtt.send(topic, message);
      console.log("message published");
    };

	ext.message_arrived = function() {
		// Reset alarm_went_off if it is true, and return true
		// otherwise, return false
		if (messageQueue.length > 0) {
			msg  = messageQueue.shift();
			messagePayload = msg.payloadString;
			messageTopic = msg.topicString;
			return true;
		}
		return false;
	};

	ext.send = function(topic, payload) {
		//console.log("trying to published message");
		mqtt.send(topic, payload);
		console.log("message published");
	};


    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [' ', 'send message %s', 'send_message', 'message'],
            [' ', 'send %s %n', 'send', 'topic', 0],
            ['r', 'message', 'get_message'],
            ['r', 'topic', 'get_topic'],
            ['h', 'when message arrived', 'message_arrived'],
            [' ', 'secure connection  %m.secureConnection', 'set_TLS', 'true'],
            [' ', 'Host %s', 'set_host', 'test.mosquitto.org'],
            [' ', 'Topic %s', 'set_topic', '/scratchExtensionTopic'],
            [' ', 'Port %n', 'set_port', 8081],
            [' ', 'connect', 'connect'],
        ],
        menus: {
            secureConnection: ['true', 'false'],
            lamp: ['nina', 'zetel', 'eettafel'],
        },
    };

    // Register the extension
    ScratchExtensions.register('MQTT extension', descriptor, ext);
})({});