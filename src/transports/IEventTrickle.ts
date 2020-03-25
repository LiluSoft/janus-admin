import { IEvent } from "./IEvent";

/**
 * trickle candidates
 */
export interface IEventTrickle extends IEvent {
	janus: "trickle";
	/**
	 * a null candidate or a completed JSON object to notify the end of the candidates.
	 */
	candidate: RTCIceCandidateInit & {"completed": boolean};
}