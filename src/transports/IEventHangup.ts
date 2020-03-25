import { IEvent } from "./IEvent";

/**
 *  the PeerConnection was closed, either by Janus or by the user/application, and as such cannot be used anymore.
 */
export interface IEventHangup extends IEvent {
	janus: "hangup";

	reason: string;

}