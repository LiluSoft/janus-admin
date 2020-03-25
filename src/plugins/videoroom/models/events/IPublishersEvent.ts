import { IVideoRoomEvent } from "./IVideoRoomEvent";
import { IPublisher } from "../IPublisher";

export interface IPublishersEvent extends IVideoRoomEvent {
	"publishers": IPublisher[];
}