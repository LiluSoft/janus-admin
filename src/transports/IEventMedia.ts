import { IEvent } from "./IEvent";

/**
 * whether Janus is receiving (receiving: true/false) audio/video (type: "audio/video") on this PeerConnection
 */
export interface IEventMedia extends IEvent {
	janus: "media";
	type: "audio" | "video" | string;
	receiving: boolean;
}