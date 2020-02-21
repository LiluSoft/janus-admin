export interface ISwitchResponse {
	"videoroom": "event",
	"switched": "ok",
	/**
	 * room ID
	 */
	"room": number;
	/**
	 * unique ID of the new publisher
	 */
	"id": number;
}