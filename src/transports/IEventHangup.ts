import { IEvent } from "./IEvent";

export interface IEventHangup extends IEvent {
	reason: string;
}