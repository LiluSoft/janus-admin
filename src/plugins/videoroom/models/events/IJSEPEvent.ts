import { IVideoRoomEvent } from "./IVideoRoomEvent";
import { IPublisher } from "../IPublisher";

export interface IJSEPEvent extends IVideoRoomEvent {
	jsep: RTCSessionDescriptionInit;
}