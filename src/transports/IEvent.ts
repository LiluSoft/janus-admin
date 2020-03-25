export interface IEvent {
	"janus": "event" | "keepalive" | "trickle" | "webrtcup" | "hangup" | "detached" | "media" | "slowlink" | "timeout";
	/**
	 * the handle identifier
	 */
	"sender": number;

	/**
	 * the session identifier
	 */
	session_id: number;
}