export interface IServerStatusResponse {
	"token_auth": boolean;
	"session_timeout": number;
	"reclaim_session_timeout": number;
	"candidates_timeout": number;
	"log_level": number;
	"log_timestamps": boolean;
	"log_colors": boolean;
	"locking_debug": boolean;
	"refcount_debug": boolean;
	"libnice_debug": boolean;
	"min_nack_queue": number;
	"no_media_timer": number;
	"slowlink_threshold": number;
}
