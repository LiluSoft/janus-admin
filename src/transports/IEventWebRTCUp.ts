import { IEvent } from "./IEvent";

/**
 * ICE and DTLS succeeded, and so Janus correctly established a PeerConnection with the user/application;
 */
export interface IEventWebRTCUp extends IEvent {
	janus: "webrtcup";
	
}