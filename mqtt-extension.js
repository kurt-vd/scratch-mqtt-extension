/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

(function(ext) {

  //$.getScript("https://kurt-vd.github.io/scratch-mqtt-extension/jquery.min.js", function(){ console.log("jquery.min.js direct loaded"); });
  $.getScript("https://kurt-vd.github.io/scratch-mqtt-extension/mqttws31.js", function(){ console.log("mqttws31.js direct loaded"); });
  console.log( "another log" ); // 200

  var mqtt;
  var reconnectTimeout = 10000;
  var msgq = [];

  host = 'server';
  port = 1883;
  useTLS = false;
  username = null;
  password = null;
  cleansession = true;

  console.log("timeout=" + reconnectTimeout);


  function MQTTconnect() {
    console.log("connect to "+ host + ":" + port + " TLS = " + useTLS + " user=" + username + " pwd=" + password);

    mqtt = new Paho.MQTT.Client(
      host,
      port,
      '',
      "web_" + parseInt(Math.random() * 100, 10)
    );

    var options = {
      timeout: 10,
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


    function onMessageArrived(message) {
        //console.log("message arrived " + message.payloadString);
        //messageQueue.push(message);
	var topic = message.destinationName;

	msgq[topic].q.push(message.payloadString);
	console.log("recv topic " + topic + " = " + message.payloadString + ", " + msgq[topic].q.length);

    };

    function onConnect() {
        console.log("connected");
        $('#status').val('Connected to ' + host + ':' + port);
	// clear object buffers
	msgq = [];
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

	ext.mqtt_connect = function(_host, _port, _tls)
	{
		host = _host;
		port = _port;
		useTLS = _tls == "true";

		MQTTconnect();
	}

	ext.mqtt_recv = function(topic)
	{
		return msgq[topic].head;
	}
	ext.mqtt_recvd = function(topic)
	{
		if (typeof msgq[topic] == 'undefined') {
			console.log("new topic " + topic);
			msgq[topic] = { head: null, q: []};
			mqtt.subscribe(topic, {qos: 0});
		}
		if (msgq[topic].q.length > 0) {
			msgq[topic].head = msgq[topic].q.shift();
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

            [' ', 'connect %s : %n tls %m.secureConnection', 'mqtt_connect', 'test.mosquitto.org', 8081, true]
        ],
        menus: {
            secureConnection: ['true', 'false']
        }
    };

    // Register the extension
    ScratchExtensions.register('MQTT extension', descriptor, ext);
})({});
