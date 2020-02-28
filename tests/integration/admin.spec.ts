import { expect } from "chai";
import chai from "chai";
import chaiSubset from "chai-subset";
import "mocha";
chai.use(chaiSubset);

import { WebSocketTransport } from "../../src";

import { JanusAdmin } from "../../src";
import { ITransport } from "../../src";
import { Transaction } from "../../src";
import { VideoRoomPlugin } from "../../src";
import { IListRequest } from "../../src";
import { IListResponse } from "../../src";
import { MQTTEventClient } from "../../src";
import { IMQTTEVHRequest } from "../../src";
import { EventClientTransport } from "../../src";
import { waitfor } from "../timing";
import dgram from "dgram";
import { AMQPEventClient } from "../../src";
import { HTTPTransport } from "../../src";
import { JanusClient } from "../../src/client/JanusClient";

const transports:
	{
		name: string;
		adminTransport: () => ITransport;
	}[]
	= [
		{
			name: "WebSocket",
			adminTransport: () => {
				return new WebSocketTransport("ws://192.168.99.100:7188", "janus-admin-protocol");
			}
		},
		{
			name: "MQTT",
			adminTransport: () => {
				return new EventClientTransport(new MQTTEventClient("tcp://192.168.99.100:1883", { username: "guest", password: "guest" }), "from-janus-admin/#", "to-janus-admin", true);
			}
		},
		{
			name: "RabbitMQ",
			adminTransport: () => {
				return new EventClientTransport(new AMQPEventClient({ hostname: "192.168.99.100", username: "guest", password: "guest" }, { noDelay: true }), "from-janus-admin", "to-janus-admin", true);
			}
		},
		{
			name: "HTTP",
			adminTransport: () => {
				return new HTTPTransport("http://192.168.99.100:7088/admin", "janusoverlord", true);
			}
		}
	];

for (const transport of transports) {
	describe(`admin using ${transport.name}`, () => {
		let adminTransport: ITransport;

		beforeEach(async () => {
			adminTransport = transport.adminTransport(); // new WebSocketTransport('ws://192.168.99.100:7188', 'janus-admin-protocol');
			expect(await adminTransport.waitForReady()).to.be.true;
		});
		afterEach(async () => {
			await adminTransport.dispose();
		});
		it("should ping", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const ping_response = await admin.ping();

			expect(ping_response).to.eq("pong");
		});

		it("should retrieve info", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const server_info = await admin.info();

			expect(server_info).to.deep.include({
				"name": "Janus WebRTC Server"
			});
			expect(Object.keys(server_info.plugins).length).to.be.at.least(1);
			expect(Object.keys(server_info.transports).length).to.be.at.least(1);
		});

		it("should get status", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const status = await admin.get_status();

			expect(status.log_level).to.exist;
		});

		it("should get sessions", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const sessions = await admin.list_sessions();
			expect(sessions).to.be.an("array"); // of numbers
		});

		it("should set session_timeout", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let server_info = await admin.info();
			const session_timeout = server_info["session-timeout"];

			const new_session_timeout = session_timeout + 1;

			const change = await admin.set_session_timeout(new_session_timeout);

			expect(change).to.eq(new_session_timeout);

			server_info = await admin.info();

			expect(server_info["session-timeout"]).to.eq(new_session_timeout);
		});

		it("should change log level", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let status = await admin.get_status();
			const current_log_level = status.log_level;

			const new_log_level = 0;

			let change = await admin.set_log_level(new_log_level);

			expect(change).to.eq(new_log_level);
			status = await admin.get_status();
			expect(status.log_level).to.eq(new_log_level);

			change = await admin.set_log_level(current_log_level);
			expect(change).to.eq(current_log_level);
			status = await admin.get_status();
			expect(status.log_level).to.eq(current_log_level);

		});


		it("should change locking debug", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let status = await admin.get_status();
			const current_locking_debug = status.locking_debug;

			let change = await admin.set_locking_debug(true);
			expect(change).to.eq(true);
			status = await admin.get_status();
			expect(status.locking_debug).to.eq(true);

			change = await admin.set_locking_debug(false);
			expect(change).to.eq(false);
			status = await admin.get_status();
			expect(status.locking_debug).to.eq(false);

			change = await admin.set_locking_debug(current_locking_debug);
			expect(change).to.eq(current_locking_debug);
		});

		it("should change refcount debug", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let status = await admin.get_status();
			const current_refcount_debug = status.refcount_debug;

			let change = await admin.set_refcount_debug(true);
			expect(change).to.eq(true);
			status = await admin.get_status();
			expect(status.refcount_debug).to.eq(true);

			change = await admin.set_refcount_debug(false);
			expect(change).to.eq(false);
			status = await admin.get_status();
			expect(status.refcount_debug).to.eq(false);

			change = await admin.set_refcount_debug(current_refcount_debug);
			expect(change).to.eq(current_refcount_debug);
		});


		it("should change libnice debug", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let status = await admin.get_status();
			const current_libnice_debug = status.libnice_debug;

			let change = await admin.set_libnice_debug(true);
			expect(change).to.eq(true);
			status = await admin.get_status();
			expect(status.libnice_debug).to.eq(true);

			change = await admin.set_libnice_debug(false);
			expect(change).to.eq(false);
			status = await admin.get_status();
			expect(status.libnice_debug).to.eq(false);

			change = await admin.set_libnice_debug(current_libnice_debug);
			expect(change).to.eq(current_libnice_debug);
		});

		it("should change log timestamps", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let status = await admin.get_status();
			const current_log_timestamps = status.log_timestamps;

			let change = await admin.set_log_timestamps(true);
			expect(change).to.eq(true);
			status = await admin.get_status();
			expect(status.log_timestamps).to.eq(true);

			change = await admin.set_log_timestamps(false);
			expect(change).to.eq(false);
			status = await admin.get_status();
			expect(status.log_timestamps).to.eq(false);

			change = await admin.set_log_timestamps(current_log_timestamps);
			expect(change).to.eq(current_log_timestamps);
		});

		it("should change log colors", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let status = await admin.get_status();
			const current_log_colors = status.log_colors;

			let change = await admin.set_log_colors(true);
			expect(change).to.eq(true);
			status = await admin.get_status();
			expect(status.log_colors).to.eq(true);

			change = await admin.set_log_colors(false);
			expect(change).to.eq(false);
			status = await admin.get_status();
			expect(status.log_colors).to.eq(false);

			change = await admin.set_log_colors(current_log_colors);
			expect(change).to.eq(current_log_colors);
		});

		it("should set min NACK queue", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let server_info = await admin.info();
			const min_nack_queue = server_info["min-nack-queue"];

			const new_min_nack_queue = min_nack_queue + 1;

			let change = await admin.set_min_nack_queue(new_min_nack_queue);
			expect(change).to.eq(new_min_nack_queue);

			server_info = await admin.info();
			expect(server_info["min-nack-queue"]).to.eq(new_min_nack_queue);


			change = await admin.set_min_nack_queue(min_nack_queue);
			expect(change).to.eq(min_nack_queue);

			server_info = await admin.info();
			expect(server_info["min-nack-queue"]).to.eq(min_nack_queue);

		});

		it("should set no-media timer", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let server_status = await admin.get_status();
			const no_media_timer = server_status.no_media_timer;

			const new_no_media_timer = no_media_timer + 1;

			let change = await admin.set_no_media_timer(new_no_media_timer);
			expect(change).to.eq(new_no_media_timer);

			server_status = await admin.get_status();
			expect(server_status.no_media_timer).to.eq(new_no_media_timer);


			change = await admin.set_no_media_timer(no_media_timer);
			expect(change).to.eq(no_media_timer);

			server_status = await admin.get_status();
			expect(server_status.no_media_timer).to.eq(no_media_timer);

		});


		it("should set slowlink threshold", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let server_status = await admin.get_status();
			const slowlink_threshold = server_status.slowlink_threshold;

			const new_slowlink_threshold = slowlink_threshold + 1;

			let change = await admin.set_slowlink_threshold(new_slowlink_threshold);
			expect(change).to.eq(new_slowlink_threshold);

			server_status = await admin.get_status();
			expect(server_status.slowlink_threshold).to.eq(new_slowlink_threshold);


			change = await admin.set_slowlink_threshold(slowlink_threshold);
			expect(change).to.eq(slowlink_threshold);

			server_status = await admin.get_status();
			expect(server_status.slowlink_threshold).to.eq(slowlink_threshold);

		});

		it("should add token", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();

			const plugins = await admin.add_token(random_token);

			expect(plugins.length).to.be.greaterThan(1);
			for (const plugin of plugins) {
				expect(plugin).to.contain("janus.plugin");
			}
		});

		it("should add token with plugins", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();

			const plugins = await admin.add_token(random_token, ["janus.plugin.videoroom"]);

			expect(plugins).to.deep.eq(["janus.plugin.videoroom"]);
		});

		it("should allow token", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();

			let plugins = await admin.add_token(random_token, ["janus.plugin.videoroom"]);
			expect(plugins).to.deep.eq(["janus.plugin.videoroom"]);

			plugins = await admin.allow_token(random_token, ["janus.plugin.voicemail"]);
			expect(plugins).to.deep.eq(["janus.plugin.videoroom", "janus.plugin.voicemail"]);
		});


		it("should disallow token", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();

			let plugins = await admin.add_token(random_token, ["janus.plugin.videoroom", "janus.plugin.voicemail"]);
			expect(plugins).to.deep.eq(["janus.plugin.videoroom", "janus.plugin.voicemail"]);

			plugins = await admin.disallow_token(random_token, ["janus.plugin.voicemail"]);
			expect(plugins).to.deep.eq(["janus.plugin.videoroom"]);
		});

		it("should list tokens", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();

			const plugins = await admin.add_token(random_token, ["janus.plugin.voicemail"]);
			expect(plugins.length).to.be.greaterThan(0);

			const tokens = await admin.list_tokens();
			expect(tokens).to.deep.include({
				token: random_token,
				allowed_plugins: ["janus.plugin.voicemail"]
			});
		});

		it("should remove token", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();

			const plugins = await admin.add_token(random_token, ["janus.plugin.voicemail"]);
			expect(plugins.length).to.be.greaterThan(0);

			let tokens = await admin.list_tokens();
			expect(tokens).to.deep.include({
				token: random_token,
				allowed_plugins: ["janus.plugin.voicemail"]
			});

			await admin.remove_token(random_token);

			tokens = await admin.list_tokens();
			expect(tokens).to.not.deep.include({
				token: random_token,
				allowed_plugins: ["janus.plugin.voicemail"]
			});
		});

		it("should change accept new sessions", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			let change = await admin.accept_new_sessions(true);
			expect(change).to.eq(true);

			change = await admin.accept_new_sessions(false);
			expect(change).to.eq(false);

			change = await admin.accept_new_sessions(true);
			expect(change).to.eq(true);
		});

		it("should destroy a session", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const sessions = await admin.list_sessions();

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);

			const session = await janusClient.CreateSession();

			let oneMoreSession = await admin.list_sessions();
			expect(oneMoreSession.length).to.eq(sessions.length + 1);

			await admin.destroy_session(session.session_id);
			oneMoreSession = await admin.list_sessions();
			expect(oneMoreSession.length).to.eq(sessions.length);


			clientTransport.dispose();
		});

		it("should list handles", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);
			const session = await janusClient.CreateSession();

			const handles = await admin.list_handles(session);

			const videoPlugin = await VideoRoomPlugin.attach(janusClient, session);
			expect(videoPlugin).to.exist;

			const handlesOneMore = await admin.list_handles(session);
			expect(handlesOneMore.length).to.eq(handles.length + 1);

			clientTransport.dispose();
		});

		it("should get handle info", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);
			const session = await janusClient.CreateSession();
			const videoPlugin = await VideoRoomPlugin.attach(janusClient, session);

			const handle_info = await admin.handle_info(session, videoPlugin.handle, false);
			expect(handle_info.session_id).to.be.a("number");

			clientTransport.dispose();
		});

		it("should start and stop pcap capture", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);
			const session = await janusClient.CreateSession();
			const videoPlugin = await VideoRoomPlugin.attach(janusClient, session);


			let success = await admin.start_pcap(videoPlugin.handle, "/tmp", "test.pcap", 10000);
			expect(success).to.be.true;

			success = await admin.stop_pcap(videoPlugin.handle);
			expect(success).to.be.true;

			clientTransport.dispose();
		});


		it("should start and stop text pcap capture", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);
			const session = await janusClient.CreateSession();
			const videoPlugin = await VideoRoomPlugin.attach(janusClient, session);


			let success = await admin.start_text2pcap(videoPlugin.handle, "/tmp", "test.pcap.txt", 10000);
			expect(success).to.be.true;

			success = await admin.stop_text2pcap(videoPlugin.handle);
			expect(success).to.be.true;

			clientTransport.dispose();
		});

		it("should send a message to plugin (testing with videoroom)", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const listReq: IListRequest = {
				request: "list"
			};

			const response = await admin.message_plugin<IListResponse>("janus.plugin.videoroom", listReq);
			expect(response.videoroom).to.eq("success");
			expect(response.list.length).to.be.greaterThan(0);
		});

		it("should hangup webrtc of handle", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);
			const session = await janusClient.CreateSession();
			const videoPlugin = await VideoRoomPlugin.attach(janusClient, session);

			const success = await admin.hangup_webrtc(videoPlugin.handle);
			expect(success).to.be.true;

			clientTransport.dispose();
		});

		it("should detach handle", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const rng = new Transaction();
			const random_token = rng.getTransactionId();
			const newTokenPlugins = await admin.add_token(random_token);
			expect(newTokenPlugins.length).to.be.greaterThan(0);

			const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
			expect(await clientTransport.waitForReady()).to.be.true;
			const janusClient = new JanusClient(clientTransport,random_token);
			const session = await janusClient.CreateSession();
			const videoPlugin = await VideoRoomPlugin.attach(janusClient, session);

			const handles = await admin.list_handles(session);

			const detached_success = await admin.detach_handle(videoPlugin.handle);
			expect(detached_success).to.be.true;

			const after_detached_handles = await admin.list_handles(session);

			expect(after_detached_handles.length).to.eq(handles.length - 1);


			clientTransport.dispose();
		});

		it("should send a request to event handler", async () => {


			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const request: IMQTTEVHRequest = {
				"request": "tweak",
				"events": "all"
			};

			const response = await admin.query_eventhandler<IMQTTEVHRequest, unknown>("janus.eventhandler.mqttevh", request);
			expect(response).to.deep.eq({ result: 200 });


		});

		it("should send a custom event", async () => {
			const client = new MQTTEventClient("tcp://192.168.99.100:1883", { username: "guest", password: "guest" });
			await client.waitForReady();

			const messages: any[] = [];
			await client.subscribe("janus/events/#", (message) => {
				messages.push(message);
			});


			await waitfor(100);

			const admin = new JanusAdmin(adminTransport, "janusoverlord");
			const response = await admin.custom_event("janus/events", { test: "valuetest" });
			expect(response).to.be.true;

			await waitfor(500);

			expect(messages).containSubset([{
				event: {
					schema: "janus/events",
					data: { test: "valuetest" }
				}
			}]);

			await client.dispose();

		});


		it("should send a custom log line", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const response = await admin.custom_logline("test line", 4);
			expect(response).to.be.true;
		});

		it("should resolve address", async () => {
			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const response = await admin.resolve_address("www.google.com");
			expect(response.ip).to.not.be.empty;
			expect(response.elapsed).to.be.greaterThan(1);
		});

		it("should test stun", async () => {
			const server = dgram.createSocket("udp4");
			server.bind(1234);

			const admin = new JanusAdmin(adminTransport, "janusoverlord");

			const response = await admin.test_stun("stun.l.google.com", 19302);

			expect(response.public_ip).to.not.be.empty;
			expect(response.public_port).to.be.greaterThan(1);
			expect(response.elapsed).to.be.greaterThan(1);

			server.close();
		}).timeout(10000);


	});
}

describe("admin", ()=>{
	it("should throw an error when the transport is not on admin endpoint", async ()=>{
		const transport =  new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
		await transport.waitForReady();
		expect(()=>{
			const admin = new JanusAdmin(transport,"test");
		}).throws;

		await transport.dispose();
	});

	it("should return the same secret",async ()=>{
		const transport =  new WebSocketTransport("ws://192.168.99.100:7188", "janus-admin-protocol");
		await transport.waitForReady();

		const admin = new JanusAdmin(transport,"test-password");

		expect(admin.admin_secret).to.eq("test-password");

		await transport.dispose();
	});
});