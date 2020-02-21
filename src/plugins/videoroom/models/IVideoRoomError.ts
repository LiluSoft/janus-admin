
// An error instead (and the same applies to all other requests, so this won't be repeated)
// would provide both an error code and a more verbose description of the cause of the issue:
export interface IVideoRoomError {
	"videoroom": "event",
	/**
	 * numeric ID, check Macros below
	 */
	"error_code": number;
	/**
	 * error description as a string
	 */
	"error": string;
}