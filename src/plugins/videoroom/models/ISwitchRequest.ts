export interface ISwitchRequest {
	"request": "switch";
	/**
	 * unique ID of the new publisher to switch to; mandatory
	 */
	"feed": number;
	/**
	 * true|false, depending on whether audio should be relayed or not; optional
	 */
	"audio"?: boolean;
	/**
	 * true|false, depending on whether video should be relayed or not; optional
	 */
	"video"?: boolean;
	/**
	 * true|false, depending on whether datachannel messages should be relayed or not; optional
	 */
	"data"?: boolean;
}