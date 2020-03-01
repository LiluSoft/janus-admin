import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface IPausedEvent extends IVideoRoomEvent {
	paused: "ok";
}