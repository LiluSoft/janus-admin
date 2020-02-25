/**
 * publishing media within a room
 */
export interface IPublishRequest {
	"request": "publish";
	/**
	 * true|false, depending on whether or not audio should be relayed; true by default
	 */
	"audio"?: boolean;
	/**
	 * true|false, depending on whether or not video should be relayed; true by default
	 */
	"video"?: boolean;
	/**
	 * true|false, depending on whether or not data should be relayed; true by default
	 */
	"data"?: boolean;
	/**
	 * audio codec to prefer among the negotiated ones; optional
	 */
	"audiocodec"?: string;
	/**
	 * video codec to prefer among the negotiated ones; optional
	 */
	"videocodec"?: string;
	/**
	 * bitrate cap to return via REMB; optional, overrides the global room value if present
	 */
	"bitrate"?: number;
	/**
	 * true|false, whether this publisher should be recorded or not; optional
	 */
	"record"?: boolean;
	/**
	 * if recording, the base path/file to use for the recording files; optional
	 */
	"filename"?: string;
	/**
	 * new display name to use in the room; optional
	 */
	"display"?: string;
}