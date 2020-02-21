export interface ISetRequest {
	"audio": boolean;
	/**
	 * optional codec name; only used when creating a PeerConnection
	 */
	"audiocodec": string;
	"video": boolean;
	/**
	 * optional codec name; only used when creating a PeerConnection
	 */
	"videocodec": string;
	"bitrate": number;
	"record": boolean;
	/**
	 * base path/filename to use for the recording
	 */
	"filename": string;
	/**
	 * substream to receive (0-2), in case simulcasting is enabled
	 */
	"substream": number;
	/**
	 * temporal layers to receive (0-2), in case simulcasting is enabled
	 */
	"temporal": number;
}