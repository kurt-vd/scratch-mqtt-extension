/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

(function(ext) {

	//$.getScript("https://kurt-vd.github.io/scratch-mqtt-extension/jquery.min.js", function(){ console.log("jquery.min.js direct loaded"); });
	$.getScript("https://kurt-vd.github.io/scratch-mqtt-extension/mqttws31.js", function(){ console.log("mqttws31.js direct loaded"); });
	console.log( "another log" ); // 200

	var mqtt;
	var reconnectTimeout = 10000;
	var objs = [];

	host = 'server';
	port = 1883;
	useTLS = false;
	username = null;
	password = null;
	cleansession = true;

	console.log("timeout=" + reconnectTimeout);


	function MQTTconnect()
	{
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

	function onConnect()
	{
		console.log("connected");
		$('#status').val('Connected to ' + host + ':' + port);
		// clear object buffers
		objs = [];
	};


	function onConnectionLost(response)
	{
		console.log("connection lost");
		setTimeout(MQTTconnect, reconnectTimeout);
		$('#status').val("connection lost: " + response.errorMessage + ". Reconnecting");
	}

	// Cleanup function when the extension is unloaded
	ext._shutdown = function() {};

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	ext._getStatus = function()
	{
		return {status: 2, msg: 'Ready'};
	};

	ext.mqtt_connect = function(_host, _port, _tls)
	{
		host = _host;
		port = _port;
		useTLS = _tls == "true";

		MQTTconnect();
	};

	function onMessageArrived(message)
	{
		var topic = message.destinationName;

		objs[topic].value = message.payloadString;
		objs[topic].recvd = true;
	}

	function test_subscribed(topic)
	{
		if (typeof objs[topic] == 'undefined') {
			console.log("subscribe " + topic);
			objs[topic] = { recvd: false };
			mqtt.subscribe(topic, {qos: 0});
		}
	}

	ext.mqtt_recv = function(topic)
	{
		test_subscribed(topic);

		return objs[topic].value;
	};

	ext.mqtt_recvd = function(topic)
	{
		test_subscribed(topic);

		var result = objs[topic].recvd;
		objs[topic].recvd = false;

		return result;
	};

	ext.mqtt_send = function(topic, payload)
	{
		//console.log("publish '" + topic + "'='" + payload + "'");
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
