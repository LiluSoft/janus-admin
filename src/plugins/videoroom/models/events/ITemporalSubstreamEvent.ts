import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface ITemporalSubstreamEvent extends IVideoRoomEvent {
	"videoroom": "event";
	/**
	 * room ID
	 */
	"room": number;
	/**
	 *  substream
	 */
	"substream"?: number;

	/**
	 *  temporal layer
	 */
	"temporal"?: number;
}