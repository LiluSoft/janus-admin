import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface IStartedEvent extends IVideoRoomEvent {
	started: "ok";
}