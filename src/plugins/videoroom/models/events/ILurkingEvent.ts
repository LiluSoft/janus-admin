import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface IUnpublishedEvent extends IVideoRoomEvent {
	"videoroom": "event";
	/**
	 * room ID
	 */
	"room": number;
	/**
	 *  unique ID of the publisher who left
	 */
	"unpublished"?: number;
}