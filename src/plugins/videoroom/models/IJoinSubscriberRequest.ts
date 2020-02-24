
export interface IJoinSubscriberRequest {
	"request": "join";
	"ptype": "subscriber";
	/**
	 * unique ID of the room to subscribe in
	 */
	"room": number;
	/**
	 * unique ID of the publisher to subscribe to; mandatory
	 */
	"feed": number;
	/**
	 * unique ID of the publisher that originated this request; optional, unless mandated by the room configuration
	 */
	"private_id"?: number;
	/**
	 * true|false, depending on whether or not the PeerConnection should be automatically closed when the publisher leaves; true by default
	 */
	"close_pc"?: boolean;
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
	 * true|false; whether or not audio should be negotiated; true by default if the publisher has audio
	 */
	"offer_audio"?: boolean;
	/**
	 * true|false; whether or not video should be negotiated; true by default if the publisher has video
	 */
	"offer_video"?: boolean;
	/**
	 * true|false; whether or not datachannels should be negotiated; true by default if the publisher has datachannels
	 */
	"offer_data"?: boolean;
}