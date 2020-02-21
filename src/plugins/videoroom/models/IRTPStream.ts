
export interface IRTPStream {
	/**
	 * host this forwarder is streaming to, same as request
	 */
	"host": string;
	/**
	 * audio RTP port, same as request if configured
	 */
	"audio": number;
	/**
	 * audio RTCP port, same as request if configured
	 */
	"audio_rtcp": number;
	/**
	 * unique numeric ID assigned to the audio RTP forwarder, if any
	 */
	"audio_stream_id": number;
	/**
	 * video RTP port, same as request if configured
	 */
	"video": number;
	/**
	 * video RTCP port, same as request if configured
	 */
	"video_rtcp": number;
	/**
	 * unique numeric ID assigned to the main video RTP forwarder, if any
	 */
	"video_stream_id": number;
	/**
	 * second video port, same as request if configured
	 */
	"video_2": number;
	/**
	 * unique numeric ID assigned to the second video RTP forwarder, if any
	 */
	"video_stream_id_2": number;
	/**
	 * third video port, same as request if configured
	 */
	"video_3": number;
	/**
	 * unique numeric ID assigned to the third video RTP forwarder, if any
	 */
	"video_stream_id_3": number;
	/**
	 * data port, same as request if configured
	 */
	"data": number;
	/**
	 * unique numeric ID assigned to datachannel messages forwarder, if any
	 */
	"data_stream_id": number;
}