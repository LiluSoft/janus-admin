import { IParticipant } from "./IParticipant";

// A successful request will produce a list of participants in a participants response:
export interface IListParticipantsResponse {
	"videoroom": "participants";
	/**
	 * unique numeric ID of the room
	 */
	"room": number;
	/**
	 * Array of participant objects
	 */
	"participants": IParticipant[];
}