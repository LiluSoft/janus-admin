export interface IListForwardersRequest {
	"request": "listforwarders";
	/**
	 * unique numeric ID of the room
	 */
	"room": number;
	/**
	 * room secret; mandatory if configured
	 */
	"secret": string;
}
