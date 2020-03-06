import { IEvent } from "./IEvent";

export interface IEventJSEP extends IEvent {
	jsep: RTCSessionDescriptionInit;

}