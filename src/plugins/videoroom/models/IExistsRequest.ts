/**
 * exists allows you to check whether a specific video room exists
 */
export interface IExistsRequest {
	"request": "exists";
	/**
	 * unique numeric ID of the room to check
	 */
	"room": number;
}