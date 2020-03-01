import { IVideoRoomEvent } from "./IVideoRoomEvent";

export interface IAudioLevelEvent extends IVideoRoomEvent{
	/**
	 * whether the publisher started or stopped talking
	 */
	"videoroom": "talking" | "stopped-talking";
	/**
	 * unique numeric ID of the room the publisher is in
	 */
	"room": number;
	/**
	 * unique numeric ID of the publisher
	 */
	"id": number;
	/**
	 * average value of audio level, 127=muted, 0='too loud'
	 */
	"audio-level-dBov-avg": number;
}