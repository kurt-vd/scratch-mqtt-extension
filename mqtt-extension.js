/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

(function(ext) {

  $.getScript("https://kurt-vd.github.io/scratch-mqtt-extension/mqttws31.js", function(){ console.log("mqttws31.js direct loaded"); });
  $.getScript("https://kurt-vd.github.io/scratch-mqtt-extension/jquery.min.js", function(){});
  console.log( "another log" ); // 200

  var mqtt;
  var reconnectTimeout = 10000;
  var messagePayload = '';
  var messageTopic = '';
  var messageQueue = [];
  var msgq = [];

  host = 'server';
  port = 1883;
  path = '';
  useTLS = false;
  username = null;
  password = null;
  cleansession = true;

  console.log("timeout=" + reconnectTimeout);


  function MQTTconnect() {
    console.log("connect to "+ host + ":" + port + path + " TLS = " + useTLS + " user=" + username + " pwd=" + password);

    mqtt = new Paho.MQTT.Client(
      host,
      port,
      path,
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
    console.log("connecting ...");
    mqtt.connect(options);
  }


    function new_topic(topic)
    {
	    mqtt.subscribe(topic, {qos: 0});
	    msgq[topic] = {subscribed: true, q: []};
    }

    function onMessageArrived(message) {
        //console.log("message arrived " + message.payloadString);
        //messageQueue.push(message);
	var topic = message.destinationName;

	if (!msgq[topic].subscribed)
		new_topic(topic);
	msgq[topic].q.push(message.payloadString);
    };

    function onConnect() {
        console.log("connected");
        $('#status').val('Connected to ' + host + ':' + port + path);
        // Connection succeeded; subscribe to our topic
        mqtt.subscribe(topic, {qos: 0});
        $('#topic').val(topic);

    };


    function onConnectionLost(response) {
        console.log("connection lost");
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

	ext.mqtt_connect = function(_host, _port, _path, _tls)
	{
		host = _host;
		port = _port;
		path = _path;
		useTLS = _tls == "true";

		MQTTconnect();
	};

	ext.mqtt_recv = function(topic)
	{
		return msgq[topic].head;
	}
	ext.mqtt_recvd = function(topic)
	{
		if (msgq[topic].subscribed)
			new_topic(topic);
		if (msgq[topic].q.length > 0) {
			msqq[topic].head = msgq[topic].q.shift();
			return true;
		}
		return false;
	};

	ext.mqtt_send = function(topic, payload) {
		console.log("publish '" + topic + "'='" + payload + "'");
		mqtt.send(topic, ''+payload);
	};


    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [' ', 'mqtt send %s %n', 'mqtt_send', 'topic', 0],
            [' ', 'mqtt send %s %s', 'mqtt_send', 'topic', ''],
            ['r', 'mqtt message %s', 'mqtt_recv', 'topic'],
            ['h', 'when mqtt %s arrived', 'mqtt_recvd', 'topic'],

            [' ', 'connect %s : %n / %s tls %m.secureConnection', 'mqtt_connect', 'test.mosquitto.org', 8081, '', true]
        ],
        menus: {
            secureConnection: ['true', 'false']
        }
    };

    // Register the extension
    ScratchExtensions.register('MQTT extension', descriptor, ext);
})({});
