
// To get a list of the participants in a specific room,
// instead, you can make use of the listparticipants request, which has to be formatted as follows:
export interface IListParticipantsRequest {
	"request": "listparticipants",
	/**
	 * unique numeric ID of the room
	 */
	"room": number;
}