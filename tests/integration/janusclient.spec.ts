import { WebSocketTransport } from "../../src/transports/WebSocketTransport";
import { VideoRoomPlugin } from "../../src/plugins/videoroom/plugin";
import { ITransport, JanusAdmin, Transaction } from "../../src";
import { expect } from "chai";
import "mocha";
import { client } from "websocket";
import { generate_random_number } from "../random";
import chai from "chai";
import chaiSubset from "chai-subset";
import { JanusClient } from "../../src/client/JanusClient";
chai.use(chaiSubset);

describe("janus client", () => {
	let adminTransport: ITransport;
	let clientToken: string;
	let clientTransport: ITransport;

	beforeEach(async () => {
		adminTransport = new WebSocketTransport("ws://192.168.99.100:7188", "janus-admin-protocol");
		expect(await adminTransport.waitForReady()).to.be.true;
		const admin = new JanusAdmin(adminTransport, "janusoverlord");

		const tokenCreator = new Transaction();
		clientToken = tokenCreator.getTransactionId();

		await admin.add_token(clientToken);

		clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
		expect(await clientTransport.waitForReady()).to.be.true;
	});
	afterEach(async () => {
		await adminTransport.dispose();
		await clientTransport.dispose();
	});

	it("should throw an error if attempting to use an admin endpoint", async () => {
		expect(() => {
			const shouldFailClient = new JanusClient(adminTransport, clientToken);
			expect(shouldFailClient).to.be.undefined;
		}).throws;
	});

	it("should create a session", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		expect(session.session_id).to.be.a("number");
	});

	it("should destroy a session", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const result = await janusClient.DestroySession(session);
		expect(result).to.be.true;
	});

	it("should keep alive", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const keepalive_result = await janusClient.keepalive(session);
		expect(keepalive_result).to.eq("ack");

		await clientTransport.dispose();
	});

	it("should create a plugin session", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		expect(handle.handle_id).to.be.a("number");
		expect(handle.plugin).to.eq("janus.plugin.videoroom");
		expect(handle.session).to.deep.eq(session);
	});

	it("should hangup a session", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const session = await janusClient.CreateSession();
		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		const hangup_result = await janusClient.hangup(handle);
		expect(hangup_result).to.be.true;
	});

	it("should create a plugin session", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const session = await janusClient.CreateSession();

		const handle = await janusClient.CreateHandle(session, "janus.plugin.videoroom");

		const result = await janusClient.DetachHandle(handle);

		expect(result).to.be.true;
	});

	it("should claim a session", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


		const firstSession = await janusClient.CreateSession();


		const tokenCreator = new Transaction();
		clientToken = tokenCreator.getTransactionId();
		const admin = new JanusAdmin(adminTransport, "janusoverlord");

		await admin.add_token(clientToken);

		const otherTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
		expect(await otherTransport.waitForReady()).to.be.true;

		const otherJanusClient = new JanusClient(otherTransport, clientToken);

		const claim_response = await otherJanusClient.claim(firstSession);
		expect(claim_response).to.be.true;

		await otherTransport.dispose();
	});


	it.skip("should trickle candidates", async () => {
		const janusClient = new JanusClient(clientTransport, clientToken);


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
