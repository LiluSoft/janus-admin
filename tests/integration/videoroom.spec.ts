import { WebSocketTransport } from "../../src/transports/WebSocketTransport";
import { VideoRoomPlugin } from "../../src/plugins/videoroom/plugin";
import { ITransport, JanusAdmin, Transaction, ServerLoggerFactory, EventClientTransport, MQTTEventClient, AMQPEventClient, HTTPTransport } from "../../src/index_server";
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
describe(`videoroom with transport ${transport.name}`, () => {
	let adminTransport: ITransport;
	let clientToken: string;
	let clientTransport: ITransport;

	beforeEach(async () => {
		adminTransport = new WebSocketTransport(loggerFactory,"ws://192.168.99.100:7188", "janus-admin-protocol");
		expect(await adminTransport.waitForReady()).to.be.true;
		const admin = new JanusAdmin(adminTransport, "janusoverlord");

		const tokenCreator = new Transaction();
		clientToken = tokenCreator.getTransactionId();

		await admin.add_token(clientToken);

		clientTransport =  transport.transport();
		expect(await clientTransport.waitForReady()).to.be.true;
	});
	afterEach(async () => {
		await adminTransport.dispose();
		await clientTransport.dispose();
	});
	it("should attach plugin", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		await videoPlugin.dispose();
		await clientTransport.dispose();
	});

	it("should create a room", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false
		});

		expect(result).to.deep.eq({
			permanent: false,
			room: room_number,
			videoroom: "created"
		});

		await videoPlugin.dispose();


	});

	it("should edit a room", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
			description: "description"
		});

		expect(create_result).to.deep.eq({
			permanent: false,
			room: room_number,
			videoroom: "created"
		});

		const edit_result = await videoPlugin.edit({
			request: "edit",
			room: room_number,
			new_description: "new description"
		});

		expect(edit_result).to.deep.eq({
			videoroom: "edited",
			room: room_number,
			permanent: false,
		});

		const list_result = await videoPlugin.list({
			request: "list"
		});

		expect(list_result.list).containSubset([{
			room: room_number,
			description: "new description"
		}]);

		await videoPlugin.dispose();

	});

	it("should destroy a room", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
			description: "description"
		});

		let list_result = await videoPlugin.list({
			request: "list"
		});

		expect(list_result.list).containSubset([{
			room: room_number,
			description: "description"
		}]);

		const destroy_result = await videoPlugin.destroy({
			request: "destroy",
			room: room_number
		});

		expect(destroy_result).to.deep.eq({
			videoroom: "destroyed",
			room: room_number,
			permanent: false
		});

		list_result = await videoPlugin.list({
			request: "list"
		});

		expect(list_result.list).not.containSubset([{
			room: room_number,
			description: "description"
		}]);

		await videoPlugin.dispose();
	});

	it("should check if a room exist", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
			description: "description"
		});

		const exists_result = await videoPlugin.exists({
			request: "exists",
			room: room_number
		});

		expect(exists_result).to.deep.eq({
			"videoroom": "success",
			room: room_number,
			exists: true
		});

		const not_exists_result = await videoPlugin.exists({
			request: "exists",
			room: room_number * 2
		});

		expect(not_exists_result).to.deep.eq({
			"videoroom": "success",
			room: room_number * 2,
			exists: false
		});

		await videoPlugin.dispose();
	});

	it("should disable a room", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
			description: "description"
		});

		const allowed_result = await videoPlugin.allowed({
			request: "allowed",
			room: room_number,
			action: "disable"
		});


		expect(allowed_result).to.deep.eq({
			room: room_number,
			videoroom: "success"
		});

		await videoPlugin.dispose();

	});

	it("should join a publisher, kick them out and make sure they are kicked", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
		});

		await videoPlugin.allowed({
			request: "allowed",
			action: "disable",
			room: room_number
		});

		const allowed_result = await videoPlugin.join_publisher({
			request: "join",
			ptype: "publisher",
			room: room_number,
			token: clientToken
		});

		expect(allowed_result).to.deep.include({
			videoroom: "joined",
			room: room_number
		});

		const participants = await videoPlugin.listparticipants({
			request: "listparticipants",
			room: room_number
		});

		expect(participants.participants).containSubset([{
			id: allowed_result.id
		}]);

		const kick_result = await videoPlugin.kick({
			request: "kick",
			room: room_number,
			id: allowed_result.id
		});

		// TODO: verify  kicked event was sent

		expect(kick_result).to.deep.eq({
			videoroom: "success"
		});

		const participants_without_kicked_member = await videoPlugin.listparticipants({
			request: "listparticipants",
			room: room_number
		});

		expect(participants_without_kicked_member.participants).not.containSubset([{
			id: allowed_result.id
		}]);

		await videoPlugin.dispose();

	});


	it("should join a publisher and publish", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
		});

		await videoPlugin.allowed({
			request: "allowed",
			action: "disable",
			room: room_number
		});

		const allowed_result = await videoPlugin.join_publisher({
			request: "join",
			ptype: "publisher",
			room: room_number,
			token: clientToken
		});

		const publish_result = await videoPlugin.publish({
			request: "publish"
		});

		expect(publish_result).to.deep.eq({
			videoroom: "event",
			room: room_number,
			configured: "ok"
		});

		await videoPlugin.dispose();

	});

	it.skip("should join a publisher, publish and unpublish", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
		});

		await videoPlugin.allowed({
			request: "allowed",
			action: "disable",
			room: room_number
		});

		const allowed_result = await videoPlugin.join_publisher({
			request: "join",
			ptype: "publisher",
			room: room_number,
			token: clientToken
		});

		const publish_result = await videoPlugin.publish({
			request: "publish"
		});

		const unpublish_result = await videoPlugin.unpublish();
		expect(unpublish_result).to.be.true;

		await videoPlugin.dispose();

	});

	it("should join a publisher, publish and configure", async () => {
		const janusClient = new JanusClient(loggerFactory,clientTransport, clientToken);


		const videoPlugin = await VideoRoomPlugin.attach(janusClient);

		const room_number = generate_random_number();

		const create_result = await videoPlugin.create({
			request: "create",
			room: room_number,
			is_private: false,
		});

		await videoPlugin.allowed({
			request: "allowed",
			action: "disable",
			room: room_number
		});

		const allowed_result = await videoPlugin.join_publisher({
			request: "join",
			ptype: "publisher",
			room: room_number,
			token: clientToken
		});

		const publish_result = await videoPlugin.publish({
			request: "publish"
		});

		const configure_result = await videoPlugin.configure({
			request: "configure",
			audio:true
		});
		expect(configure_result).to.be.true;

		await videoPlugin.dispose();

	});

});

// (async () => {


// 	// let transport = new HTTPTransport();

// 	const clientTransport = new WebSocketTransport("ws://192.168.99.100:8188", "janus-protocol");
// 	await clientTransport.waitForReady();

// 	const videoPlugin = await VideoRoomPlugin.attach(clientTransport);
// 	let rooms = await videoPlugin.list({
// 		request: "list"
// 	});

// 	this._logger.debug("all", rooms);

// 	try {
// 		const createReq = await videoPlugin.create({
// 			request: "create",
// 			room: 981811,
// 			is_private: false,
// 			description: "my free test",
// 			publishers: 100,
// 			bitrate: 128000,
// 			record: false,
// 			notify_joining: true,
// 			audiolevel_event: true,
// 			audio_active_packets: 50,
// 			audio_level_average: 40
// 		});


// 		this._logger.debug("created", createReq.room, createReq.videoroom);

// 		rooms = await videoPlugin.list({
// 			request: "list"
// 		});
// 		this._logger.debug("after all", rooms);

// 	} catch (e) {
// 		this._logger.error("unable to create room", e);
// 	}

// 	await videoPlugin.dispose();

// 	clientTransport.dispose();
// })();
}