

/**
 * This allows you to modify the room description, secret, pin and whether it's private or not:
 * you won't be able to modify other more static properties, like the room ID, the sampling rate,
 * the extensions-related stuff and so on. If you're interested in changing the ACL, instead, check
 * the allowed message. An edit request has to be formatted as follows:
 */
export interface IEditRequest {
	"request": "edit";
	/**
	 * unique numeric ID of the room to edit
	 */
	"room": number;
	/**
	 * room secret, mandatory if configured
	 */
	"secret"?: string;
	/**
	 * new pretty name of the room, optional
	 */
	"new_description"?: string;
	/**
	 * new password required to edit/destroy the room, optional
	 */
	"new_secret"?: string;
	/**
	 * new password required to join the room, optional
	 */
	"new_pin"?: string;
	/**
	 * true|false, whether the room should appear in a list request
	 */
	"new_is_private"?: boolean;
	/**
	 * true|false, whether the room should require private_id from subscribers
	 */
	"new_require_pvtid"?: boolean;
	/**
	 * new bitrate cap to force on all publishers (except those with custom overrides)
	 */
	"new_bitrate"?: number;
	/**
	 * new period for regular PLI keyframe requests to publishers
	 */
	"new_fir_freq"?: number;
	/**
	 * new cap on the number of concurrent active WebRTC publishers
	 */
	"new_publishers"?: number;
	/**
	 * true|false, whether the room should be also removed from the config file, default false
	 */
	"permanent"?: boolean;
}