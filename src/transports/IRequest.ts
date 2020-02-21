export interface IRequest {
	janus: "create" | "attach" | "destroy" | "detach" | "message" | "keepalive" | "ping" | "info"
	| "get_status" | "list_sessions" | "set_session_timeout" | "set_log_level" | "set_locking_debug"
	| "set_refcount_debug" | "set_libnice_debug" | "set_log_timestamps" | "set_log_colors"
	| "set_min_nack_queue" | "set_no_media_timer" | "set_slowlink_threshold" | "add_token"
	| "allow_token" | "disallow_token" | "list_tokens" | "remove_token" | "accept_new_sessions"
	| "destroy_session" | "list_handles" | "handle_info" | "start_pcap" | "start_text2pcap"
	| "stop_pcap" | "stop_text2pcap" | "message_plugin" | "hangup_webrtc" | "detach_handle" | "query_eventhandler"
	| "custom_event" | "custom_logline" | "resolve_address" | "test_stun";
	transaction?: string;
	correlation_id?: string;
	session_id?: number;
	handle_id?: number;
	admin_secret?: string;

	plugin?: string;
}