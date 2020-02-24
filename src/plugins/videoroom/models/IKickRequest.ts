/**
 * kick participants using the kick request
 */
export interface IKickRequest {
	"request": "kick";
	/**
	 * room secret, mandatory if configured
	 */
	"secret"?: string;
	/**
	 * unique numeric ID of the room
	 */
	"room": number;
	/**
	 * unique numeric ID of the participant to kick
	 */
	"id": number;
}