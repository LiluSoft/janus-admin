export interface IStopRTPForwardRequest {
	"request": "stop_rtp_forward";
	/**
	 * unique numeric ID of the room the publisher is in
	 */
	"room": number;
	/**
	 * unique numeric ID of the publisher to update
	 */
	"publisher_id": number;
	/**
	 * unique numeric ID of the RTP forwarder
	 */
	"stream_id": number;
}