export interface IConfigureRequest {
	"request": "configure";
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
	 * substream to receive (0-2), in case simulcasting is enabled; optional
	 */
	"substream"?: number;
	/**
	 * temporal layers to receive (0-2), in case simulcasting is enabled; optional
	 */
	"temporal"?: number;
	/**
	 * spatial layer to receive (0-2), in case VP9-SVC is enabled; optional
	 */
	"spatial_layer": number;
	/**
	 * temporal layers to receive (0-2), in case VP9-SVC is enabled; optional
	 */
	"temporal_layer": number;
	/**
	 * bitrate cap to return via REMB; optional, overrides the global room value if present (unless bitrate_cap is set)
	 */
	"bitrate"?: number;
	/**
	 * true|false, whether we should send this publisher a keyframe request
	 */
	"keyframe"?: boolean;
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