export interface IAttachedResponse {
	"videoroom": "attached",
	/**
	 * room ID
	 */
	"room": number;
	/**
	 * publisher ID
	 */
	"feed": number;
	/**
	 * the display name of the publisher, if any
	 */
	"display": string;
}