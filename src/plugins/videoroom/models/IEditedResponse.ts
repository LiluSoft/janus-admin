/**
 * A successful edit procedure will result in an edited response:
 */
export interface IEditedResponse {
	"videoroom": "edited";
	/**
	 * unique numeric ID
	 */
	"room": number;
}