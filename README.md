# Janus Admin

A Complete Janus Admin API client which enables easy access through HTTP, WebSockets, MQTT and RabbitMQ.

The major components include a Transport and [[JanusAdmin]] where Transport is implemented by either [[WebSocketTransport]], [[HTTPTransport]] or [[EventClientTransport]]. EventClientTransport is using [[IEventClient]] which is implemented by [[MQTTEventClient]] and [[AMQPEventClient]].

The JanusAdmin uses the transport to communicate with the Janus API to provide easy access.

## Documentation

The [official documentation](https://lilusoft.com/products/janus-admin) can be generated from source.

## Examples

The following Transports are possible

### WebSocket

```TypeScript
const transport = new WebSocketTransport("ws://janus-server:7188", "janus-admin-protocol");
await transport.waitForReady();

const admin = new JanusAdmin(transport, "janusoverlord");
await admin...

await transport.dispose();
```

### MQTT

```TypeScript
const transport = new EventClientTransport(new MQTTEventClient("tcp://janus-server:1883", { username: "guest", password: "guest" }), "from-janus-admin/#", "to-janus-admin", true);
await transport.waitForReady()

const admin = new JanusAdmin(transport, "janusoverlord");
await admin...


await transport.dispose();
```

### RabbitMQ

```TypeScript
const transport =  new EventClientTransport(new AMQPEventClient({ hostname: "janus-server", username: "guest", password: "guest" }, { noDelay: true }), "from-janus-admin", "to-janus-admin", true);
await transport.waitForReady()

const admin = new JanusAdmin(transport, "janusoverlord");
await admin...


await transport.dispose();
```

### HTTP

```TypeScript
const transport =  new HTTPTransport("http://janus-server:7088/admin", "janusoverlord", true);
await transport.waitForReady()

const admin = new JanusAdmin(transport, "janusoverlord");
await admin...


await transport.dispose();
```

## How to Configure Your Janus Instance

It could be hard to figure out the right settings the first time, that's why we've included a sample Dockerfile and configuration that we test this code on, feel free to copy it or use it as-is for your needs, you can find it in the [janus-docker repository](https://github.com/LiluSoft/janus-docker).

## License

This module is released under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html), if its unsuitable for your needs, you may contact us at https://lilusoft.com
