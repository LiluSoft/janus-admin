import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface ILeavingEvent extends IVideoRoomEvent {
	"videoroom": "event";
	/**
	 * room ID
	 */
	"room": number;
	/**
	 *  unique ID of the lurking who left
	 */
	"leaving"?: number;
}