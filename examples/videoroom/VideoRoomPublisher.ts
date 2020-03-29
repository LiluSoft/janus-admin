import { ILogger } from "../../src/logger/ILogger";
import { ILoggerFactory } from "../../src/logger/ILoggerFactory";
import { VideoRoomPlugin, IPublisher } from "../../src/plugins";
import { JanusClient, JanusSessionEventHandler, ITransport, WebRTC, WebRTCPeerConnection, WebRTCMediaStream, ICandidate, WebRTCPeerOptions } from "../../src/index_browser";
import { EventEmitter } from "events";

/**
 * VideoRoom Publisher
 *
 */
export class VideoRoomPublisher {
	private _logger: ILogger;
	private videoRoom: VideoRoomPlugin;
	private sessionEventHandler: JanusSessionEventHandler;
	private peerConnection: WebRTCPeerConnection;
	public id: number;
	public private_id: number;
	private myStream: WebRTCMediaStream;
	private _eventEmitter = new EventEmitter();
	private bitrateTimer: NodeJS.Timeout;

	public getStream() {
		return this.myStream;
	}

	constructor(public readonly loggerFactory: ILoggerFactory, private janusClient: JanusClient, private webrtc: WebRTC) {
		this._logger = loggerFactory.create("VideoRoomPublisher");
	}
	public async initialize(doSimulcast: boolean) {
		this._logger.info("Document Ready");
		this.videoRoom = await VideoRoomPlugin.attach(this.janusClient);

		this.sessionEventHandler = new JanusSessionEventHandler(this.loggerFactory, this.janusClient.transport, this.videoRoom.session);
		this.peerConnection = this.webrtc.newPeerConnection();

		this.videoRoom.on_joined(async (event) => {
			this._logger.info("Joined!", event);

			this.id = event.plugindata.data.id;
			this.private_id = event.plugindata.data.private_id;


			await this.publishOwnFeed(true, doSimulcast);
			this._eventEmitter.emit("localstream", this.myStream);

			this.bitrateTimer = setInterval(() => {
				// Display updated bitrate, if supported
				const bitrate = this.peerConnection.getBitrate();
				this._eventEmitter.emit("bitrate", bitrate);
			}, 1000);

			this._logger.debug("Got a list of available publishers/feeds:");
			for (const publisher of event.plugindata.data.publishers) {
				const id = publisher["id"];
				const display = publisher["display"];
				const audio_codec = publisher["audio_codec"];
				const video_codec = publisher["video_codec"];

				this._logger.debug("Publisher  >> [" + id + "] " + display + " (audio: " + audio_codec + ", video: " + video_codec + ")");
				this._eventEmitter.emit("remotefeed", publisher);
			}
		});

		this.videoRoom.on_publishers(async (event) => {
			this._logger.debug("Got a list of", event.plugindata.data.publishers.length, "new available publishers/feeds");
			for (const publisher of event.plugindata.data.publishers) {
				const id = publisher["id"];
				const display = publisher["display"];
				const audio_codec = publisher["audio_codec"];
				const video_codec = publisher["video_codec"];

				this._logger.debug("Publisher  >> [" + id + "] " + display + " (audio: " + audio_codec + ", video: " + video_codec + ")");
				this._eventEmitter.emit("remotefeed", publisher);
			}
		});

		this.videoRoom.on_leaving((event) => {
			const leaving = event.plugindata.data.leaving;
			this._eventEmitter.emit("leaving", leaving);
			clearInterval(this.bitrateTimer);
		});

		this.videoRoom.on_unpublished((event) => {
			this._logger.debug("Unpublish local feed", event);
			const unpublished = event.plugindata.data.unpublished;
			this._logger.info("Publisher left: ", unpublished);
			// TODO: remove feed from list of feeds and reset container

			const leaving = event.plugindata.data.unpublished;
			this._eventEmitter.emit("leaving", leaving);

		});

		this.videoRoom.on_destroyed(() => {
			this._logger.warn("The room has been destroyed!");
			this._eventEmitter.emit("destroyed");
		});

		this.videoRoom.on_jsep(async (event) => {
			this._logger.debug("Handling SDP for local stream as well...", event);
			if (!event.jsep) {
				this._logger.error("JSEP event was raised without jsep!", event);
				return;
			}

			await this.peerConnection.acceptAnswer(event.jsep);
			// sfutest.handleRemoteJsep({jsep});
			// Check if any of the media we wanted to publish has
			// been rejected (e.g., wrong or unsupported codec)
			this._eventEmitter.emit("accepted_answer", event.plugindata.data);

			const audio = event.plugindata.data["audio_codec"];
			if (this.myStream && this.myStream.getAudioTracks() && this.myStream.getAudioTracks().length > 0 && !audio) {
				this._logger.warn("Audio Stream Rejected", this.myStream.getAudioTracks(), audio);
				// Audio has been rejected
				toastr.warning("Our audio stream has been rejected, viewers won't hear us");
			}
			const video = event.plugindata.data["video_codec"];
			if (this.myStream && this.myStream.getVideoTracks() && this.myStream.getVideoTracks().length > 0 && !video) {
				this._logger.warn("Video Stream Rejected", this.myStream.getVideoTracks(), video);
				// Video has been rejected
				toastr.warning("Our video stream has been rejected, viewers won't see us");
				// Hide the webcam video
				$("#myvideo").hide();
				$("#videolocal").append(
					"<div class=\"no-video-container\">" +
					"<i class=\"fa fa-video-camera fa-5 no-video-icon\" style=\"height: 100%;\"></i>" +
					"<span class=\"no-video-text\" style=\"font-size: 16px;\">Video rejected, no webcam</span>" +
					"</div>");
			}
		});

		this.sessionEventHandler!.on_trickle(async (trickleEvent) => {
			if (trickleEvent.candidate.completed === true) {
				await this.peerConnection.addIceCandidate();
			} else {
				await this.peerConnection.addIceCandidate(trickleEvent.candidate as RTCIceCandidateInit);
			}

		});


		this.sessionEventHandler.on_keepalive(async () => {
			await this.janusClient.keepalive(this.videoRoom.session);
		});

		this.sessionEventHandler!.on_webrtcup(async (event) => {
			this._logger.info("Janus says this WebRTC PeerConnection is " + (true ? "up" : "down") + " now");
			this._eventEmitter.emit("webrtcState", true);

		});

		this.sessionEventHandler.on_media((event) => {
			this._eventEmitter.emit("mediaState", event.type, event.receiving);
		});


		this.sessionEventHandler.on_hangup(async (event) => {
			this._logger.info("Janus says this WebRTC PeerConnection is " + (false ? "up" : "down") + " now");
			this._eventEmitter.emit("webrtcState", false);
		});

		this._logger.info("Plugin attached! id", this.videoRoom.handle);
	}

	public async joinRoom(room: number, display_name: string) {
		const rooms = await this.videoRoom.list({
			request: "list"
		});

		if (!rooms.list.find(v => v.room === room)) {
			this._logger.info("Room", room, "does not exist, creating it");
			const roomCreated = await this.videoRoom.create({
				request: "create",
				room,
				is_private: false
			});
		}

		await this.videoRoom.join_publisher({
			request: "join",
			room,
			ptype: "publisher",
			display: display_name
		});

	}



	public async publishOwnFeed(useAudio: boolean, doSimulcast: boolean) {
		// Publish our stream
		$("#publish").attr("disabled", "disabled").unbind("click");
		this._eventEmitter.emit("consentDialog", true);
		const stream = await this.webrtc.sources.startCapture({ audio: true, video: true });
		this._eventEmitter.emit("consentDialog", false);
		this.myStream = stream;

		this.peerConnection.on_connectionstatechange((state) => {
			this._eventEmitter.emit("connectionstatechange", state);
		});

		this.peerConnection.on_icecandidate(async (event) => {
			if (event) {
				this._logger.debug("got ice candidate", event);
			} else {
				this._logger.debug("got ice candidate list end");
			}
			if (event) {
				const result = await this.videoRoom.trickle({
					janus: "trickle",
					candidate: event as ICandidate
				});
				this._logger.debug("trickle", event, "result", result);
			} else {
				const result = await this.videoRoom.trickle({
					janus: "trickle",
					candidate: { completed: true }
				});
				this._logger.debug("trickle", event, "result", result);
			}
		});

		// mandatory for janus
		const dataChannel = this.peerConnection.getDataChannel();
		let offerOptions: WebRTCPeerOptions = WebRTCPeerOptions.None;
		offerOptions |= WebRTCPeerOptions.VideoSend;
		if (useAudio) {
			offerOptions |= WebRTCPeerOptions.AudioSend;
		}

		// If you want to test simulcasting (Chrome and Firefox only), then
		// pass a ?simulcast=true when opening this demo page: it will turn
		// the following 'simulcast' property to pass to janus.js to true
		if (doSimulcast) {
			offerOptions |= WebRTCPeerOptions.Simulcast;
		}

		this.peerConnection.addTracks(this.myStream);

		try {
			const jsep = await this.peerConnection.createOffer(offerOptions);

			this._logger.debug("Got publisher SDP!", jsep);

			const configureAnswer = await this.videoRoom.configure({
				request: "configure",
				audio: useAudio,
				video: true,
			}, jsep);


			// You can force a specific codec to use when publishing by using the
			// audiocodec and videocodec properties, for instance:
			// 		publish["audiocodec"] = "opus"
			// to force Opus as the audio codec to use, or:
			// 		publish["videocodec"] = "vp9"
			// to force VP9 as the videocodec to use. In both case, though, forcing
			// a codec will only work if: (1) the codec is actually in the SDP (and
			// so the browser supports it), and (2) the codec is in the list of
			// allowed codecs in a room. With respect to the point (2) above,
			// refer to the text in janus.plugin.videoroom.jcfg for more details
		} catch (error) {
			this._logger.error("WebRTC error:", error);
			if (useAudio) {
				await this.publishOwnFeed(false, doSimulcast);
			} else {
				bootbox.alert("WebRTC error... " + JSON.stringify(error));
				$("#publish").removeAttr("disabled").click(() => {
					this.publishOwnFeed(true, doSimulcast).catch((error) => {
						this._logger.error("Error publishing", error);
					});
				});
			}
		}

	}

	public on_localstream(handler: (stream: WebRTCMediaStream) => void) {
		this._eventEmitter.on("localstream", handler);
	}

	public on_remotefeed(handler: (publisher: IPublisher) => void) {
		this._eventEmitter.on("remotefeed", handler);
	}

	public on_leaving(handler: (publisher_id: number) => void) {
		this._eventEmitter.on("leaving", handler);
	}

	public on_destroyed(handler: () => void) {
		this._eventEmitter.on("destroyed", handler);
	}

	public on_webrtcState(handler: (on: boolean) => void) {
		this._eventEmitter.on("webrtcState", handler);
	}

	public on_bitrate(handler: (bitrate: number) => void) {
		this._eventEmitter.on("bitrate", handler);
	}

	public on_consentDialog(handler: (on: boolean) => void) {
		this._eventEmitter.on("consentDialog", handler);
	}

	public on_acceptedAnswer(handler: (answer: IPublisher) => void) {
		this._eventEmitter.on("accepted_answer", handler);
	}

	public on_mediaState(handler: (type: string, receiving: boolean) => void) {
		this._eventEmitter.on("mediaState", handler);
	}

	public on_connectionstatechange(handler: (state: RTCPeerConnectionState) => void) {
		this._eventEmitter.on("connectionstatechange", handler);
	}

	public toggleMute() {
		const muted = this.myStream.isAudioMuted();
		this._logger.info((muted ? "Unmuting" : "Muting") + " local stream...");
		if (muted)
			this.myStream.unmuteAudio();
		else
			this.myStream.muteAudio();
		return this.myStream.isAudioMuted();
		// $("#mute").html(muted ? "Unmute" : "Mute");
	}

	public async unpublish() {
		return this.videoRoom.unpublish();
	}

	public async configureBitrate(bitrate: number) {
		await this.videoRoom.configure({
			request: "configure",
			bitrate
		});
	}

	public async dispose() {
		await this.videoRoom.leave();
		await this.videoRoom.dispose();
		await this.sessionEventHandler.dispose();
		this.peerConnection.dispose();
	}
}