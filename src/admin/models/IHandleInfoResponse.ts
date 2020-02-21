export interface IHandleInfo {
	session_id: number;
	session_last_activity: number;
	session_transport: string;
	handle_id: number;
	'loop-running': boolean;
	created: number;
	current_time: number;
	plugin: string;
	plugin_specific: {
		hangingup: number;
		destroyed: number;
	},
	flags: {
		'got-offer': boolean;
		'got-answer': boolean;
		negotiated: boolean;
		'processing-offer': boolean;
		starting: boolean;
		'ice-restart': boolean;
		ready: boolean;
		stopped: boolean;
		alert: boolean;
		trickle: boolean;
		'all-trickles': boolean;
		'resend-trickles': boolean;
		'trickle-synced': boolean;
		'data-channels': boolean;
		'has-audio': boolean;
		'has-video': boolean;
		'new-datachan-sdp': boolean;
		'rfc4588-rtx': boolean;
		cleaning: boolean;
	},
	sdps: {

	},
	'queued-packets': number;
	streams: [];
}

export interface IHandleInfoResponse {
	janus: "success";
	transaction?: string;
	info: IHandleInfo;
}