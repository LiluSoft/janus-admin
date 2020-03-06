export interface IEvent {
	"janus": "event" | "keepalive" |  "trickle" |  "webrtcup" | "hangup" | "detached" |  "media" | "slowlink";
	"sender": number;
}