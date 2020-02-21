/**
 * Janus Session Container
 *
 * Janus session can contain several different plugin handles at the same time, meaning you can start
 * several different WebRTC sessions with the same or different plugins for the same user using the same Janus session.
 * @export
 * @class JanusSession
 */
export class JanusSession {
	constructor(public readonly session_id: number) {
	}

	// TODO: track in session timeout, if timed out mark and notify
}