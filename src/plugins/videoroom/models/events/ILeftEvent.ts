import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface ILeftEvent extends IVideoRoomEvent {
	"videoroom": "event";
	"left": "ok";
}