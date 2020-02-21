
export interface IListForwardersResponse {
	"videoroom": "forwarders",
	/**
	 * unique numeric ID of the room
	 */
	"room": number;
	/**
	 * Array of publishers with RTP forwarders
	 */
	"rtp_forwarders": [
		{
			/**
			 * unique numeric ID of publisher #1
			 */
			"publisher_id": number;
			/**
			 * Array of RTP forwarders
			 */
			"rtp_forwarders": [
				{
					/**
					 * unique numeric ID assigned to this audio RTP forwarder, if any
					 */
					"audio_stream_id"?: number;
					// <unique numeric ID assigned to this video RTP forwarder, if any>,
					"video_stream_id"?: number;
					// <unique numeric ID assigned to this datachannel messages forwarder, if any>
					"data_stream_id"?: number;
					// "<IP this forwarder is streaming to>",
					"ip": string;
					// <port this forwarder is streaming to>,
					"port": number;
					// <local port this forwarder is using to get RTCP feedback, if any>,
					"rtcp_port"?: number;
					// <SSRC this forwarder is using, if any>,
					"ssrc"?: string;
					// <payload type this forwarder is using, if any>,
					"pt"?: number;
					// <video substream this video forwarder is relaying, if any>,
					"substream"?: string;
					// <true|false, whether the RTP stream is encrypted>
					"srtp": boolean;
				}
			],
		}
	]
}