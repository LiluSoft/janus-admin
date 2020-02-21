import { WebSocketTransport } from "../../src/transports/WebSocketTransport";
import { VideoRoomPlugin } from "../../src/plugins/videoroom/plugin";

(async () => {


	// let transport = new HTTPTransport();

	const clientTransport = new WebSocketTransport('ws://192.168.99.100:8188', 'janus-protocol');
	await clientTransport.waitForReady()

	const videoPlugin = await VideoRoomPlugin.attach(clientTransport);
	let rooms = await videoPlugin.list({
		request: "list"
	})

	this._logger.debug("all", rooms);

	try {
		const createReq = await videoPlugin.create({
			request: "create",
			room: 981811,
			is_private: false,
			description: "my free test",
			publishers: 100,
			bitrate: 128000,
			record: false,
			notify_joining: true,
			audiolevel_event: true,
			audio_active_packets: 50,
			audio_level_average: 40
		})


		this._logger.debug("created", createReq.room, createReq.videoroom);

		rooms = await videoPlugin.list({
			request: "list"
		});
		this._logger.debug("after all", rooms);

	} catch (e) {
		this._logger.error("unable to create room", e);
	}

	await videoPlugin.dispose();

	clientTransport.dispose();
})();