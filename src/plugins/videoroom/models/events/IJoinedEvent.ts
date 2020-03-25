import { IPublisher } from "../IPublisher";
import { IAttendee } from "../IAttendee";

export interface IJoinedEvent {
	"videoroom": "joined";
	/**
	 * room ID
	 */
	"room": number;
	/**
	 * description of the room, if available
	 */
	"description"?: string;
	/**
	 * unique ID of the participant
	 */
	"id": number;
	/**
	 * a different unique ID associated to the participant; meant to be private
	 */
	"private_id": number;
	/**
	 * Other active publishers
	 */
	"publishers": IPublisher[];

	/**
	 * attendees
	 */
	attendees: IAttendee[];
}