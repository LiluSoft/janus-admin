export interface IDetachedEvent {
	janus: "detached";
	session_id: number;
	sender: number;
}