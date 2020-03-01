import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface ISwitchedEvent extends IVideoRoomEvent  {
	"videoroom": "event";
	"switched": "ok";
	/**
	 * room ID
	 */
	"room": number;
	/**
	 * unique ID of the new publisher
	 */
	"id": number;
}