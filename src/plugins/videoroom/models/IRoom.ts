export interface IRoom {
	/**
	 * unique numeric ID
	 */
	"room": number;
	/**
	 * Name of the room
	 */
	"description": string;
	/**
	 * true|false, whether a PIN is required to join this room
	 */
	"pin_required": boolean;
	/**
	 * how many publishers can actually publish via WebRTC at the same time
	 */
	"max_publishers": number;
	/**
	 * bitrate cap that should be forced (via REMB) on all publishers by default
	 */
	"bitrate": number;
	/**
	 * true|false, whether the above cap should act as a limit to dynamic bitrate changes by publishers
	 */
	"bitrate_cap": boolean;
	/**
	 * how often a keyframe request is sent via PLI/FIR to active publishers
	 */
	"fir_freq": number;
	/**
	 * comma separated list of allowed audio codecs
	 */
	"audiocodec": string;
	/**
	 * comma separated list of allowed video codecs
	 */
	"videocodec": string;
	/**
	 * true|false, whether the room is being recorded
	 */
	"record": boolean;
	/**
	 * if recording, the path where the .mjr files are being saved
	 */
	"record_dir": string;
	/**
	 * count of the participants (publishers, active or not; not subscribers)
	 */
	"num_participants": number;
}