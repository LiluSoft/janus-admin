import { IEvent } from "./IEvent";

export interface IEventTrickle extends IEvent {
	candidate: RTCIceCandidateInit;
}