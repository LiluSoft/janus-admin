
export interface IJoinPublisherRequest {
	"request": "join",
	"ptype": "publisher",
	/**
	 * unique ID of the room to join
	 */
	"room": number;
	/**
	 * unique ID to register for the publisher; optional, will be chosen by the plugin if missing
	 */
	"id"?: number;
	/**
	 * display name for the publisher; optional
	 */
	"display"?: string;
	/**
	 * invitation token, in case the room has an ACL; optional
	 */
	"token"?: string;
}