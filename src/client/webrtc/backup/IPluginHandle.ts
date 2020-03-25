// export interface IPluginHandle {
// 	session: string;
// 	plugin: string;
// 	id: string;
// 	token: string;
// 	detached: boolean;
// 	webrtcStuff: {
// 		started: boolean;
// 		myStream?: MediaStream;
// 		streamExternal: boolean;
// 		remoteStream?: MediaStream;
// 		mySdp?: RTCSessionDescriptionInit & {trickle?: boolean};
// 		//  {
// 		// 	type: "offer" | "pranswer" | "answer" | "rollback" | null;
// 		// 	sdp?: string | null;
// 		// 	trickle?: boolean;
// 		// },
// 		mediaConstraints: RTCOfferOptions;
// 		pc?: RTCPeerConnection;
// 		dataChannel?:{[name:string]: RTCDataChannel & {pending?: string[]}};
// 		dtmfSender?: RTCDTMFSender | null;
// 		trickle: boolean,
// 		iceDone: boolean,
// 		volume: {
// 			[stream: string]: {
// 				value?: number;
// 				timer?: NodeJS.Timeout | number;
// 			}
// 		},
// 		bitrate: {
// 			value?: string;
// 			bsnow?: number;
// 			bsbefore?: number;
// 			tsnow?: number;
// 			tsbefore?: number;
// 			timer?: NodeJS.Timer | number;
// 		};
// 		sdpSent: boolean;
// 		remoteSdp: string | undefined;
// 		candidates?: RTCIceCandidateInit[];
// 	};
// 	// getId : function(); { return handleId; },
// 	// getPlugin : function() { return plugin; },
// 	// getVolume : function() { return getVolume(handleId, true); },
// 	// getRemoteVolume : function() { return getVolume(handleId, true); },
// 	// getLocalVolume : function() { return getVolume(handleId, false); },
// 	// isAudioMuted : function() { return isMuted(handleId, false); },
// 	// muteAudio : function() { return mute(handleId, false, true); },
// 	// unmuteAudio : function() { return mute(handleId, false, false); },
// 	// isVideoMuted : function() { return isMuted(handleId, true); },
// 	// muteVideo : function() { return mute(handleId, true, true); },
// 	// unmuteVideo : function() { return mute(handleId, true, false); },
// 	// getBitrate : function() { return getBitrate(handleId); },
// 	// send : function(callbacks) { sendMessage(handleId, callbacks); },
// 	// data : function(callbacks) { sendData(handleId, callbacks); },
// 	// dtmf : function(callbacks) { sendDtmf(handleId, callbacks); },
// 	consentDialog: (on: boolean) => void;
// 	iceState: (state: RTCIceConnectionState) => void;
// 	mediaState: (type: "audio" | "video" | string, on: boolean)=>void;
// 	webrtcState : (state:boolean, reason?:string)=>void;
// 	slowLink : (uplink:boolean, lost_packets : number)=>void;
// 	onmessage : (data: unknown, jsep: RTCSessionDescriptionInit)=>void;
// 	ontimeout: ()=>void;
// 	// createOffer; : function(callbacks) { prepareWebrtc(handleId, callbacks); },
// 	// createAnswer : function(callbacks) { prepareWebrtc(handleId, callbacks); },
// 	// handleRemoteJsep : function(callbacks) { prepareWebrtcPeer(handleId, callbacks); },
// 	onlocalstream: (stream: MediaStream) => void;
// 	onremotestream: (stream: MediaStream) => void;
// 	ondata: (data: string, label:string) => void;
// 	ondataopen: (label:string) => void;
// 	oncleanup: ()=>void;
// 	ondetached:()=>void;
// 	hangup : (sendRequest?: boolean)=>void;// { cleanupWebrtc(handleId, sendRequest === true); },
// 	detach : ()=>void;// function(callbacks) { destroyHandle(handleId, callbacks); }
// }