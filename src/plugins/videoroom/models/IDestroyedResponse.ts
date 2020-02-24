/**
 * A successful destruction procedure will result in a destroyed response
 */
export interface IDestroyedResponse {
	"videoroom": "destroyed";
	/**
	 * unique numeric ID
	 */
	"room": number;
}