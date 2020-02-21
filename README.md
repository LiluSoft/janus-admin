# Janus Admin

A Complete Janus Admin API client which enables easy access through HTTP, WebSockets, MQTT and RabbitMQ.

The major components include a Transport and JanusAdmin where Transport is implemented by either WebSocketTransport, HTTPTransport or EventClientTransport. EventClientTransport is using IEventClient which is implemented by MQTTEventClient and AMQPEventClient.

The JanusAdmin uses the transport to communicate with the Janus API to provide easy access.


