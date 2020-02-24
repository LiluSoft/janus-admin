export interface IStopRTPForwardResponse {
	"videoroom": "stop_rtp_forward";
	/**
	 * unique numeric ID, same as request
	 */
	"room": number;
	/**
	 * unique numeric ID, same as request
	 */
	"publisher_id": number;
	/**
	 * unique numeric ID, same as request
	 */
	"stream_id": number;
}