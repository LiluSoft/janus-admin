
// create can be used to create a new video room, and has to be formatted as follows
export interface ICreateRequest {
	"request": "create";
	/**
	 * unique numeric ID, optional, chosen by plugin if missing
	 */
	"room": number;
	/**
	 * true|false, whether the room should be saved in the config file, default false
	 */
	"permanent"?: boolean;
	/**
	 * pretty name of the room, optional
	 */
	"description"?: string;
	/**
	 * password required to edit/destroy the room, optional
	 */
	"secret"?: string;
	/**
	 * password required to join the room, optional
	 */
	"pin"?: string;
	/**
	 * true|false, whether the room should appear in a list request
	 */
	"is_private": boolean;
	/**
	 * array of string tokens users can use to join this room, optional
	 */
	"allowed"?: string[];
	// =
	/**
	 * whether subscriptions are required to provide a valid a valid private_id to associate with a publisher, default=false
	 */
	"require_pvtid"?: boolean;
	/**
	 * max number of concurrent senders> (e.g., 6 for a video conference or 1 for a webinar, default=3)
	 */
	"publishers"?: number;
	/**
	 * max video bitrate for senders> (e.g., 128000)
	 */
	"bitrate"?: number;
	/**
	 * cap bitrate instead of recommend
	 */
	"bitrate_cap"?: boolean;
	/**
	 * send a FIR to publishers every fir_freq seconds> (0=disable)
	 */
	"fir_freq"?: number;
	/**
	 * opus|g722|pcmu|pcma|isac32|isac16 (audio codec to force on publishers, default=opus can be a comma separated list in order of preference, e.g., opus,pcmu)
	 */
	"audiocodec"?: string;
	/**
	 * vp8|vp9|h264 (video codec to force on publishers, default=vp8 can be a comma separated list in order of preference, e.g., vp9,vp8,h264)
	 */
	"videocodec"?: string;
	// = yes|no ()
	/**
	 * whether SVC support must be enabled; works only for VP9, default=false
	 */
	"video_svc"?: boolean;
	/**
	 * whether the ssrc-audio-level RTP extension must be negotiated/used or not for new publishers, default=true
	 */
	"audiolevel_ext"?: boolean;
	/**
	 * whether to emit event to other users or not
	 */
	"audiolevel_event"?: boolean;
	/**
	 * 100 (number of packets with audio level, default=100, 2 seconds)
	 */
	"audio_active_packets"?: number;
	/**
	 * 25 (average value of audio level, 127=muted, 0='too loud', default=25)
	 */
	"audio_level_average"?: number;
	/**
	 * whether the video-orientation RTP extension must be negotiated/used or not for new publishers, default=true
	 */
	"videoorient_ext"?: boolean;
	/**
	 * whether the playout-delay RTP extension must be negotiated/used or not for new publishers, default=true
	 */
	"playoutdelay_ext"?: boolean;
	/**
	 * whether the transport wide CC RTP extension must be negotiated/used or not for new publishers, default=false
	 */
	"transport_wide_cc_ext"?: boolean;
	/**
	 * whether this room should be recorded, default=false
	 */
	"record"?: boolean;
	/**
	 * folder where recordings should be stored, when enabled
	 */
	"rec_dir"?: string;
	/**
	 * optional, whether to notify all participants when a new
	 * participant joins the room. The Videoroom plugin by design only notifies
	 * new feeds (publishers), and enabling this may result extra notification
	 * traffic. This flag is particularly useful when enabled with \c require_pvtid
	 * for admin to manage listening only participants. default=false)
	 */
	"notify_joining"?: boolean;
	/**
	 * whether inband FEC must be negotiated; only works for Opus, default=false
	 */
	"opus_fec"?:boolean;
}