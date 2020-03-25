// import { ILogger } from "../../logger/ILogger";
// import { ILoggerFactory } from "../../logger/ILoggerFactory";
// import adapter from "webrtc-adapter";
// import { JanusSessionEventHandler } from "../../abstractions/JanusSessionEventHandler";
// import { ITransport } from "../../transports/ITransport";
// import { JanusSession } from "../../abstractions";
// import { WebRTCMediaStream } from "./WebRTCMediaStream";
// import { WebRTCPeerConnection } from "./WebRTCPeerConnection";

// export class WebRTCClient {
// 	private _is_initialized = false;
// 	private _logger: ILogger;
// 	safariVp8: boolean;

// 	public get myStream() : WebRTCMediaStream{
// 		throw new Error("not implemented");
// 	}
// 	public get peerConnection() : WebRTCPeerConnection{
// 		throw new Error("not implemented");
// 	}

// 	public iceServers = [{urls: "stun:stun.l.google.com:19302"}];

// 	private sessionEventHandler: JanusSessionEventHandler;

// 	constructor(public readonly loggerFactory: ILoggerFactory, public readonly transport: ITransport) {
// 		this._logger = loggerFactory.create("WebRTCClient");

// 	}

// 	/**
// 	 * Initialize WebRTC Client
// 	 */
// 	public async initialize() {
// 		if (this._is_initialized) {
// 			return;
// 		}

// 		const iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
// 		const eventName = iOS ? "pagehide" : "beforeunload";

// 		// Detect tab close: make sure we don't loose existing onbeforeunload handlers
// 		// (note: for iOS we need to subscribe to a different event, 'pagehide', see
// 		// https://gist.github.com/thehunmonkgroup/6bee8941a49b86be31a787fe8f4b8cfe)
// 		window.addEventListener(eventName, (event) => {
// 			this._cleanup();
// 		});

// 		await this._checkSafariVP8Support();
// 	}

// 	private _cleanup() {
// 		this._logger.debug("Cleanup");
// 			// for(var s in Janus.sessions) {
// 			// 	if(Janus.sessions[s] !== null && Janus.sessions[s] !== undefined &&
// 			// 			Janus.sessions[s].destroyOnUnload) {
// 			// 		Janus.log("Destroying session " + s);
// 			// 		Janus.sessions[s].destroy({asyncRequest: false, notifyDestroyed: false});
// 			// 	}
// 			// }
// 			// if(oldOBF && typeof oldOBF == "function")
// 			// 	oldOBF();
// 	}

// 	private async _checkSafariVP8Support() {
// 		// If this is a Safari Technology Preview, check if VP8 is supported
// 		this.safariVp8 = false;
// 		if (adapter.browserDetails.browser === "safari" &&
// 			adapter.browserDetails.version! >= 605) {
// 			this._logger.debug("Checking Safari VP8 Support");
// 			// Let's see if RTCRtpSender.getCapabilities() is there
// 			const videoCapabilities = (RTCRtpSender && RTCRtpSender.getCapabilities) ? RTCRtpSender.getCapabilities("video") : undefined;
// 			if (videoCapabilities && videoCapabilities.codecs && videoCapabilities.codecs.length) {
// 				for (const codec of videoCapabilities.codecs) {
// 					if (codec && codec.mimeType && codec.mimeType.toLowerCase() === "video/vp8") {
// 						this.safariVp8 = true;
// 						break;
// 					}
// 				}
// 				if (this.safariVp8) {
// 					this._logger.info("This version of Safari supports VP8");
// 				} else {
// 					this._logger.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
// 						"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
// 				}
// 			} else {
// 				// We do it in a very ugly way, as there's no alternative...
// 				// We create a PeerConnection to see if VP8 is in an offer
// 				let testpc: RTCPeerConnection | undefined = new RTCPeerConnection({});
// 				const offer = await testpc.createOffer({ offerToReceiveVideo: true });
// 				this.safariVp8 = (offer.sdp || "").indexOf("VP8") !== -1;
// 				if (this.safariVp8) {
// 					this._logger.info("This version of Safari supports VP8");
// 				} else {
// 					this._logger.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
// 						"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
// 				}
// 				testpc.close();
// 				testpc = undefined;

// 			}
// 		}
// 	}

// 	public static isGetUserMediaAvailable() {
// 		return (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? true : false;
// 	}

// 	/**
// 	 * enumerate devices
// 	 * @param constraints
// 	 */
// 	public async listDevices(constraints: MediaStreamConstraints) {
// 		if (constraints == null) constraints = { audio: true, video: true };
// 		if (navigator.mediaDevices) {
// 			try {
// 				const stream = await navigator.mediaDevices.getUserMedia(constraints);

// 				const devices = await navigator.mediaDevices.enumerateDevices();
// 				this._logger.debug("devices", devices);

// 				// Get rid of the now useless stream
// 				try {
// 					const tracks = stream.getTracks();
// 					for (const mst of tracks) {
// 						if (mst !== null && mst !== undefined)
// 							mst.stop();
// 					}
// 				} catch (e) {
// 					this._logger.warn("unable to stop tracks", e);
// 				}

// 				return devices;
// 			} catch (err) {
// 				this._logger.error("Error retrieving devices", err);
// 				throw err;
// 			}
// 		} else {
// 			this._logger.warn("navigator.mediaDevices unavailable");
// 			return [];
// 		}
// 	}

// 	/**
// 	 * attach a stream to a video element
// 	 * @param element
// 	 * @param stream
// 	 */
// 	public attachMediaStream(element: HTMLVideoElement, stream: MediaStream) {
// 		if (adapter.browserDetails.browser === "chrome") {
// 			const chromever = adapter.browserDetails.version!;
// 			if (chromever >= 43) {
// 				element.srcObject = stream;
// 			} else if (typeof element.src !== "undefined") {
// 				element.src = URL.createObjectURL(stream);
// 			} else {
// 				this._logger.error("Error attaching stream to element");
// 			}
// 		} else {
// 			element.srcObject = stream;
// 		}
// 	}

// 	/**
// 	 * Reattach video stream from one element to another
// 	 * @param to
// 	 * @param from
// 	 */
// 	public reattachMediaStream(to: HTMLVideoElement, from: HTMLVideoElement) {
// 		if (adapter.browserDetails.browser === "chrome") {
// 			const chromever = adapter.browserDetails.version!;
// 			if (chromever >= 43) {
// 				to.srcObject = from.srcObject;
// 			} else if (typeof to.src !== "undefined") {
// 				to.src = from.src;
// 			} else {
// 				this._logger.error("Error reattaching stream to element");
// 			}
// 		} else {
// 			to.srcObject = from.srcObject;
// 		}
// 	}


// 	/**
// 	 * check whether WebRTC is supported by this browser
// 	 */
// 	public isWebrtcSupported() {
// 		return window.RTCPeerConnection !== undefined && window.RTCPeerConnection !== null &&
// 			navigator.getUserMedia !== undefined && navigator.getUserMedia !== null;
// 	}


// 	public on_consentDialog(handler: (on:boolean)=>void){
// 		throw new Error("not implemented");
// 	}

// 	public on_webrtcState(handler: (state: boolean, reason: string) => void) {
// 		// this.clientSession.
// 		throw new Error("not implemented");
// 	}

// 	public on_mediaState(handler: (type: string, receiving: boolean)=>void){
// 		// this.clientSession;
// 		throw new Error("not implemented");
// 	}

// 	public on_localstream(handler:(stream:MediaStream)=>void){
// 		throw new Error("not implemented");
// 	}
// }