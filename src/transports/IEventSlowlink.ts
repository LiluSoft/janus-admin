import { IEvent } from "./IEvent";

export interface IEventSlowlink extends IEvent {
	uplink: boolean;
	lost: number;
}