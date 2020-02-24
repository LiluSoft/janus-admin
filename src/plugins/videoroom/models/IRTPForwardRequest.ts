
export interface IRTPForwardRequest {
	"request": "rtp_forward";
	/**
	 * unique numeric ID of the room the publisher is in
	 */
	"room": number;
	/**
	 * unique numeric ID of the publisher to relay externally
	 */
	"publisher_id": number;
	/**
	 * host address to forward the RTP and data packets to
	 */
	"host": string;
	/**
	 * port to forward the audio RTP packets to
	 */
	"audio_port": number;
	/**
	 * audio SSRC to use to use when streaming; optional
	 */
	"audio_ssrc"?: string;
	/**
	 * audio payload type to use when streaming; optional
	 */
	"audio_pt"?: string;
	/**
	 * port to contact to receive audio RTCP feedback from the recipient; optional, and currently unused for audio
	 */
	"audio_rtcp_port"?: number;
	/**
	 * port to forward the video RTP packets to
	 */
	"video_port": number;
	/**
	 * video SSRC to use to use when streaming; optional
	 */
	"video_ssrc"?: string;
	/**
	 * video payload type to use when streaming; optional
	 */
	"video_pt"?: string;
	/**
	 * port to contact to receive video RTCP feedback from the recipient; optional
	 */
	"video_rtcp_port"?: number;
	/**
	 * if simulcasting, port to forward the video RTP packets from the second substream/layer to
	 */
	"video_port_2": number;
	/**
	 * if simulcasting, video SSRC to use to use the second substream/layer; optional
	 */
	"video_ssrc_2"?: string;
	/**
	 * if simulcasting, video payload type to use the second substream/layer; optional
	 */
	"video_pt_2"?: number;
	/**
	 * if simulcasting, port to forward the video RTP packets from the third substream/layer to
	 */
	"video_port_3": number;
	/**
	 * if simulcasting, video SSRC to use to use the third substream/layer; optional
	 */
	"video_ssrc_3"?: string;
	/**
	 * if simulcasting, video payload type to use the third substream/layer; optional
	 */
	"video_pt_3"?: string;
	/**
	 * port to forward the datachannel messages to
	 */
	"data_port": number;
	/**
	 * length of authentication tag (32 or 80); optional
	 */
	"srtp_suite"?: number;
	/**
	 * key to use as crypto (base64 encoded key as in SDES); optional
	 */
	"srtp_crypto"?: string;
}