import { IEvent } from "./IEvent";

export interface IEventMedia extends IEvent {
	type: "audio" | "video" | string;
	receiving: boolean;
}