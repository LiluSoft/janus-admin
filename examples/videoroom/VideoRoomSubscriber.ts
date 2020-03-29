import { ILogger } from "../../src/logger/ILogger";
import { ILoggerFactory } from "../../src/logger/ILoggerFactory";
import { VideoRoomPlugin, ITransport, JanusClient, WebRTC, WebRTCPeerConnection, JanusSessionEventHandler, ICandidate, WebRTCPeerOptions, WebRTCMediaStream, IPublisher } from "../../src/index_browser";
import { EventEmitter } from "events";
import { ITemporalSubstreamEvent } from "../../src/plugins/videoroom/models/events/ITemporalSubstreamEvent";

export class VideoRoomSubscriber {
	private _logger: ILogger;
	private videoRoom: VideoRoomPlugin;
	private peerConnection: WebRTCPeerConnection;
	private sessionEventHandler: JanusSessionEventHandler;

	private _eventEmitter = new EventEmitter();

	private bitrateTimer: NodeJS.Timeout;

	constructor(
		public readonly loggerFactory: ILoggerFactory,
		private janusClient: JanusClient,
		private webrtc: WebRTC,
		private chatroom: number,
		public subscription: IPublisher,
		private publisher_id: number) {
		this._logger = loggerFactory.create("VideoRoomSubscriber");
		this._logger.debug("Creating Remote Feed", subscription);
	}

	public async initialize() {
		this._logger.debug("Initializing Remote Feed", this.subscription);


		// A new feed has been published, create a new plugin handle and attach to it as a subscriber
		// try {
		this.videoRoom = await VideoRoomPlugin.attach(this.janusClient);
		this._logger.info("Subscriber Plugin attached!");

		this.peerConnection = this.webrtc.newPeerConnection(),
			this.sessionEventHandler = new JanusSessionEventHandler(this.loggerFactory, this.janusClient.transport, this.videoRoom.session);

		this._logger.debug("Joining the room", this.subscription, this.chatroom);
		const subscription = await this.videoRoom.join_subscriber({
			request: "join",
			room: this.chatroom,
			ptype: "subscriber",
			feed: this.subscription.id,
			private_id: this.publisher_id,
		});



		this.videoRoom.on_attached(async (event) => {
			this._logger.debug("attached", this.subscription, event);

			this._eventEmitter.emit("attached", this.subscription);
			// Subscriber created and attached

			this._logger.info("Successfully attached to feed ", this.subscription, "in room", event.plugindata.data.room);

			this.sessionEventHandler!.on_trickle(async (trickleEvent) => {
				if ((!trickleEvent.candidate) || trickleEvent.candidate.completed === true) {
					await this.peerConnection!.addIceCandidate();
				} else {
					await this.peerConnection!.addIceCandidate(trickleEvent.candidate as RTCIceCandidateInit);
				}

			});

			this.sessionEventHandler!.on_keepalive(async () => {
				await this.janusClient.keepalive(this.sessionEventHandler!.session);
			});


			this.sessionEventHandler!.on_webrtcup(async (webrtcUpEvent) => {
				this._logger.info("Janus says this WebRTC PeerConnection is " + (true ? "up" : "down") + " now");
				this._eventEmitter.emit("webrtcState", true);

			});

			this.sessionEventHandler.on_media((mediaEvent) => {
				this._logger.info("Janus says this WebRTC PeerConnection is", mediaEvent.receiving ? "receiving" : "not receiving", mediaEvent.type);
				this._eventEmitter.emit("mediaState", mediaEvent.type, mediaEvent.receiving);
			});


			this.sessionEventHandler.on_hangup(async (hangupEvent) => {
				this._logger.info("Janus says this WebRTC PeerConnection is " + (false ? "up" : "down") + " now");
				this._eventEmitter.emit("webrtcState", false, hangupEvent.reason);
			});

			this.peerConnection.on_connectionstatechange((state) => {
				this._eventEmitter.emit("connectionstatechange", state);
			});

			this.peerConnection.on_icecandidate(async (iceEvent) => {
				if (iceEvent) {
					this._logger.debug("got ice candidate for remote feed", iceEvent.candidate);
				} else {
					this._logger.debug("got ice candidate list end for remote feed");
				}
				if (iceEvent) {
					const result = await this.videoRoom.trickle({
						janus: "trickle",
						candidate: iceEvent as ICandidate
					});
					this._logger.debug("remote trickle", iceEvent, "result", result);
				} else {
					const result = await this.videoRoom.trickle({
						janus: "trickle",
						candidate: { completed: true }
					});
					this._logger.debug("remote trickle", iceEvent, "result", result);
				}
			});

			this.peerConnection!.on_remotestreams((streams) => {
				this._logger.debug("Remote feed streams", streams);

				this._eventEmitter.emit("remotestreams", streams);


				this.bitrateTimer = setInterval(() => {
					const bitrate = this.peerConnection.getBitrate();
					this._eventEmitter.emit("bitrate", bitrate);
				}, 1000);


			});


			// oncleanup
			this.videoRoom.on_leaving((leavingEvent) => {
				this._logger.info(" ::: Got a cleanup notification (remote feed " + leavingEvent.plugindata.data.leaving + ") :::");
				clearInterval(this.bitrateTimer);
				this._eventEmitter.emit("leaving", leavingEvent.plugindata.data.leaving);

			});
		});

		this.videoRoom.on_temporal_substream((event) => {
			this._logger.debug("received temporal substream", this.subscription, event);
			this._eventEmitter.emit("temporal_substream", event.plugindata.data);

		});

		this.videoRoom.on_jsep(async (event) => {
			this._logger.debug("Handling SDP as well...", event);
			if (!event.jsep) {
				this._logger.error("JSEP event was raised without jsep!", event);
				return;
			}
			// Answer and attach
			try {
				await this.peerConnection!.acceptOffer(event.jsep);
				// const dataChannel = remoteFeed.peerConnection!.getDataChannel();

				// | janus.WebRTCPeerOptions.iceRestart
				const jsep = await this.peerConnection!.createAnswer(WebRTCPeerOptions.AudioReceive | WebRTCPeerOptions.VideoReceive | WebRTCPeerOptions.iceRestart);
				this._logger.debug("created answer", jsep);
				await this.videoRoom.start(jsep);
			} catch (error) {
				this._logger.error("WebRTC error:", error);
				bootbox.alert("WebRTC error... " + JSON.stringify(error));
			}
		});









	}

	public on_attached(handler: (subscriber_id: number) => void) {
		this._eventEmitter.on("attached", handler);
	}

	public on_webrtcState(handler: (on: boolean, reason: string) => void) {
		this._eventEmitter.on("webrtcState", handler);
	}

	public on_mediaState(handler: (type: string, receiving: boolean) => void) {
		this._eventEmitter.on("mediaState", handler);
	}

	public on_remotestreams(handler: (streams: WebRTCMediaStream[]) => void) {
		this._eventEmitter.on("remotestreams", handler);
	}

	public on_bitrate(handler: (bitrate: number) => void) {
		this._eventEmitter.on("bitrate", handler);
	}

	public on_leaving(handler: (subscriber_id: number) => void) {
		this._eventEmitter.on("leaving", handler);
	}

	public on_temporal_substream(handler: (event: ITemporalSubstreamEvent) => void) {
		this._eventEmitter.on("temporal_substream", handler);
	}

	public on_connectionstatechange(handler:(state: RTCPeerConnectionState)=>void){
		this._eventEmitter.on("connectionstatechange", handler);
	}

	public async configureSubstream(substream: number) {
		return await this.videoRoom.configure({ request: "configure", substream });
	}



	public async configureTemporal(temporal: number) {
		return await this.videoRoom.configure({ request: "configure", temporal });
	}

	public async dispose() {
		try {
			await this.videoRoom.leave();
		} catch (e) {
			this._logger.trace("unable to leave", e);
		}
		await this.videoRoom.dispose();
		this._eventEmitter.removeAllListeners();
		await this.sessionEventHandler.dispose();
		this.peerConnection.dispose();
	}
}