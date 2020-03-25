// import { ILogger } from "../../logger/ILogger";
// import { ILoggerFactory } from "../../logger/ILoggerFactory";
// import { ITransport } from "../../transports/ITransport";
// import { JanusSession } from "../../abstractions/JanusSession";
// import { JanusSessionEventHandler } from "../../abstractions/JanusSessionEventHandler";
// import { EventEmitter } from "events";
// import { WebRTCDataChannel } from "./WebRTCDataChannel";
// import { WebRTCDTMFSender } from "./WebRTCDTMFSender";

// export class WebRTCClientSession {
// 	private _logger: ILogger;
// 	private _eventEmitter = new EventEmitter();
// 	private sessionEventHandler: JanusSessionEventHandler;
// 	private remoteSdp: string;

// 	private peerConnection: RTCPeerConnection;

// 	private candidates?: RTCIceCandidateInit[];

// 	private dataChannel: WebRTCDataChannel;
// 	private dtmfSender: WebRTCDTMFSender;





// // session : JanusSession;
// // plugin : string;
// // token : string;
// // detached : boolean;
// // webrtcStuff : {
// // 	started : boolean;
// // 	myStream : null,
// // 	streamExternal : false,
// // 	remoteStream : null,
// // 	mySdp : null,
// // 	mediaConstraints : null,
// // 	pc : null,
// // 	dataChannel : null,
// // 	dtmfSender : null,
// // 	trickle : true,
// // 	iceDone : false,
// // 	volume : {
// // 		value : null,
// // 		timer : null
// // 	},
// // 	bitrate : {
// // 		value : null,
// // 		bsnow : null,
// // 		bsbefore : null,
// // 		tsnow : null,
// // 		tsbefore : null,
// // 		timer : null
// // 	}
// // };,


// 	constructor(public readonly loggerFactory: ILoggerFactory, public readonly transport: ITransport) {
// 		this._logger = loggerFactory.create("WebRTCClientSession");
// 	}

// 	private _registerEventHandler(session: JanusSession) {
// 		this.sessionEventHandler = new JanusSessionEventHandler(this.loggerFactory, this.transport, session);

// 		this.sessionEventHandler.on_trickle(async (event) => {
// 			// We got a trickle candidate from Janus
// 			if (this.peerConnection && this.remoteSdp) {
// 				// Add candidate right now
// 				this._logger.debug("Adding remote candidate:", event.candidate);
// 				if (!event.candidate || event.candidate.completed === true) {
// 					// end-of-candidates
// 					this.peerConnection.addIceCandidate(null as any);
// 				} else {
// 					// New candidate
// 					this.peerConnection.addIceCandidate(event.candidate);
// 				}
// 			} else {
// 				// We didn't do setRemoteDescription (trickle got here before the offer?)
// 				this._logger.debug("We didn't do setRemoteDescription (trickle got here before the offer?), caching candidate");
// 				if (!this.candidates)
// 					this.candidates = [];
// 				this.candidates.push(event.candidate);
// 				this._logger.debug("Caching Candidate", this.candidates);
// 			}
// 		});

// 		this.sessionEventHandler.on_webrtcup((event) => {
// 			// The PeerConnection with the server is up! Notify this
// 			this._logger.debug("Got a webrtcup event on session " , event.session_id, event);
// 			this._eventEmitter.emit("webrtcState", true);
// 		});

// 		this.sessionEventHandler.on_hangup((event)=>{
// 			// A plugin asked the core to hangup a PeerConnection on one of our handles
// 			this._logger.debug("Got a hangup event on session " , event.session_id, event);
// 			this._eventEmitter.emit("webrtcState", false,event.reason);
// 			this._eventEmitter.emit("hangup");
// 		});

// 		this.sessionEventHandler.on_detached((event)=>{
// 			// A plugin asked the core to detach one of our handles
// 			this._logger.debug("Got a detached event on session " , event.session_id, event);
// 			this._eventEmitter.emit("detached");
// 			// pluginHandle.detach();
// 		});

// 		this.sessionEventHandler.on_media((event)=>{
// 			// Media started/stopped flowing
// 			this._logger.debug("Got a media event on session",event);// + sessionId);
// 			this._eventEmitter.emit("mediaState", event.type, event.receiving);
// 		});

// 		this.sessionEventHandler.on_slowlink((event)=>{
// 			// Trouble uplink or downlink
// 			this._logger.debug("Got a slowlink event on session " ,event);
// 			this._eventEmitter.emit("slowLink", event.uplink, event.lost);
// 		});

// 		// TODO: on "event" not implemented?

// 		this.sessionEventHandler.on_timeout(()=>{
// 			this._logger.error("Timeout on session");
// 		});
// 	}

// 	/**
// 	 * The PeerConnection with the server is up/down
// 	 * @param handler
// 	 */
// 	public on_webrtcState(handler: (state: boolean, reason: string) => void) {
// 		this._eventEmitter.on("webrtcState", handler);
// 	}

// 	/**
// 	 * A plugin asked the core to hangup a PeerConnection on one of our handles
// 	 * @param handler
// 	 */
// 	public on_hungup(handler: ()=>void){
// 		this._eventEmitter.on("hungup", handler);
// 	}

// 	/**
// 	 *  A plugin asked the core to detach
// 	 * @param handler
// 	 */
// 	public on_detached(handler: ()=>void){
// 		this._eventEmitter.on("detached",handler);
// 	}

// 	/**
// 	 * Media started/stopped flowing
// 	 * @param handler
// 	 */
// 	public on_mediaState(handler: (type: string, receiving: boolean)=>void){
// 		this._eventEmitter.on("mediaState", handler);
// 	}

// 	/**
// 	 * Trouble uplink or downlink
// 	 * @param handler
// 	 */
// 	public on_slowLink(handler:(uplink:boolean, lost:number)=>void){
// 		this._eventEmitter.on("slowLink", handler);
// 	}


// 	public getId()
// 	 { return handleId; }
// 	public getPlugin() {
// 		 return plugin; }
// 	public getVolume() {
// 		 // return getVolume(handleId, true);
// 		},
// 	public getRemoteVolume () {
// 		 return getVolume(handleId, true);
// 		},
// 	public getLocalVolume() {
// 		 return getVolume(handleId, false);
// 		},
// 	public isAudioMuted () {
// 		 return isMuted(handleId, false); },
// 	public muteAudio() {
// 		 return mute(handleId, false, true); },
// 	public unmuteAudio() {
// 		return mute(handleId, false, false); },
// 	public isVideoMuted() {
// 		return isMuted(handleId, true); },
// 	public muteVideo() {
// 		return mute(handleId, true, true); },
// 	public unmuteVideo() {
// 		return mute(handleId, true, false); },
// 	public getBitrate() {
// 		return getBitrate(handleId); },
// 	public send(callbacks) {
// 		sendMessage(handleId, callbacks); },
// 	public data(text:string) {
// 		this.dataChannel.send(text);
// 	}
// 	public dtmf(tones: string, duration?: number, interToneGap?: number) {
// 		this.dtmfSender.sendDtmf(tones, duration, interToneGap);
// 	 }
// 	// public consentDialog : callbacks.consentDialog,
// 	// public iceState; : callbacks.iceState,
// 	// public mediaState; : callbacks.mediaState,
// 	// public webrtcState; : callbacks.webrtcState,
// 	// public slowLink; : callbacks.slowLink,
// 	// public onmessage; : callbacks.onmessage,
// 	// public createOffer; : function(callbacks) { prepareWebrtc(handleId, callbacks); },
// 	// public createAnswer : function(callbacks) { prepareWebrtc(handleId, callbacks); },
// 	// public handleRemoteJsep : function(callbacks) { prepareWebrtcPeer(handleId, callbacks); },
// 	// public onlocalstream : callbacks.onlocalstream,
// 	// public onremotestream; : callbacks.onremotestream,
// 	// public ondata; : callbacks.ondata,
// 	// public ondataopen; : callbacks.ondataopen,
// 	// public oncleanup; : callbacks.oncleanup,
// 	// public ondetached; : callbacks.ondetached,
// 	// public hangup; : function(sendRequest) { cleanupWebrtc(handleId, sendRequest === true); },
// 	// public detach : function(callbacks) { destroyHandle(handleId, callbacks); }
// }