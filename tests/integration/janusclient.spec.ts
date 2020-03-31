import { WebSocketTransport } from "../../src/transports/WebSocketTransport";
import { VideoRoomPlugin } from "../../src/plugins/videoroom/plugin";
import { ITransport, JanusAdmin, Transaction, ServerLoggerFactory, MQTTEventClient, EventClientTransport, AMQPEventClient, HTTPTransport } from "../../src/index_server";
import { expect } from "chai";
import "mocha";
import { client } from "websocket";
import { generate_random_number } from "../random";
import chai from "chai";
import chaiSubset from "chai-subset";
import { JanusClient } from "../../src/client/JanusClient";
chai.use(chaiSubset);

const loggerFactory = new ServerLoggerFactory();



const transports:
	{
		name: string;
		transport: () => ITransport;
	}[]
	= [
		{
			name: "WebSocket",
			transport: () => {
				return new WebSocketTransport(loggerFactory, "ws://192.168.99.100:8188", "janus-protocol");
			}
		},
		{
			name: "MQTT",
			transport: () => {
				return new EventClientTransport(loggerFactory,new MQTTEventClient(loggerFactory,"tcp://192.168.99.100:1883", { username: "guest", password: "guest" }), "from-janus/#", "to-janus", false);
			}
		},
		{
			name: "RabbitMQ",
			transport: () => {
				return new EventClientTransport(loggerFactory,new AMQPEventClient(loggerFactory,{ hostname: "192.168.99.100", username: "guest", password: "guest" }, { noDelay: true }), "from-janus", "to-janus", false);
			}
		},
		{
			name: "HTTP",
			transport: () => {
				return new HTTPTransport(loggerFactory,"http://192.168.99.100:8088/janus", "janusoverlord", false);
			}
		}
	];

for (const transport of transports) {
describe(`janus client with transport ${transport.name}`, () => {
	let adminTransport: ITransport;
	let clientToken: string;
	let clientTransport: ITransport;

	beforeEach(async () => {
		adminTransport = new WebSocketTransport(loggerFactory, "ws://192.168.99.100:7188", "janus-admin-protocol");
		expect(await adminTransport.waitForReady()).to.be.true;
		const admin = new JanusAdmin(adminTransport, "janusoverlord");

		const tokenCreator = new Transaction();
		clientToken = tokenCreator.getTransactionId();

		await admin.add_token(clientToken);

		clientTransport = transport.transport();
		expect(await clientTransport.waitForReady()).to.be.true;
	});
	afterEach(async () => {
		await adminTransport.dispose();
		await clientTransport.dispose();
	});

	it("should throw an error if attempting to use an admin endpoint", async () => {
		expect(() => {
			const shouldFailClient = new JanusClient(loggerFactory, adminTransport, clientToken);
			expect(shouldFailClient).to.be.undefined;
		}).throws;
	});

	it("should create a session", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		expect(session.session_id).to.be.a("number");
	});

	it("should destroy a session", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const result = await janusClient.DestroySession(session);
		expect(result).to.be.true;
	});

	it("should keep alive", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const keepalive_result = await janusClient.keepalive(session);
		expect(keepalive_result).to.eq("ack");

		await clientTransport.dispose();
	});

	it("should create a plugin session", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		expect(handle.handle_id).to.be.a("number");
		expect(handle.plugin).to.eq("janus.plugin.videoroom");
		expect(handle.session).to.deep.eq(session);
	});

	it("should hangup a session", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();
		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		const hangup_result = await janusClient.hangup(handle);
		expect(hangup_result).to.be.true;
	});

	it("should create a plugin session", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		const result = await janusClient.DetachHandle(handle);

		expect(result).to.be.true;
	});

	it("should claim a session", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const firstSession = await janusClient.CreateSession();


		const tokenCreator = new Transaction();
		clientToken = tokenCreator.getTransactionId();
		const admin = new JanusAdmin(adminTransport, "janusoverlord");

		await admin.add_token(clientToken);

		const otherTransport = new WebSocketTransport(loggerFactory, "ws://192.168.99.100:8188", "janus-protocol");
		expect(await otherTransport.waitForReady()).to.be.true;

		const otherJanusClient = new JanusClient(loggerFactory, otherTransport, clientToken);

		const claim_response = await otherJanusClient.claim(firstSession);
		expect(claim_response).to.be.true;

		await otherTransport.dispose();
	});


	it.skip("should trickle candidates", async () => {
		const janusClient = new JanusClient(loggerFactory, clientTransport, clientToken);


		const session = await janusClient.CreateSession();
		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		const trickle_result = await janusClient.trickle({
			janus: "trickle",
			candidate: {
				"sdpMid": "video",
				"sdpMLineIndex": 1,
				"candidate": "..."
			}
		}, handle);

		expect(trickle_result).to.deep.eq({});
	});
});
}