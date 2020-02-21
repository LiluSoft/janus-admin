export interface ICreatedResponse {
	"videoroom": "created",
	/**
	 * unique numeric ID
	 */
	"room": number;
	/**
	 * true if saved to config file, false if not
	 */
	"permanent": boolean;
}