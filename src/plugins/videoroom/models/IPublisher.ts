export interface IPublisher {
	/**
	 * unique ID of active publisher #1
	 */
	"id": number;
	/**
	 * display name of active publisher #1, if any
	 */
	"display": string;
	/**
	 * audio codec used by active publisher #1, if any
	 */
	"audio_codec": string;
	/**
	 * video codec used by active publisher #1, if any
	 */
	"video_codec": string;
	/**
	 * true|false, whether the publisher is talking or not (only if audio levels are used)
	 */
	"talking": boolean;
}