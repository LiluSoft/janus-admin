export class NoSIPPlugin {
	/**
	 * Get rid of an ongoing session
	 */
	public hangup() {
		// TODO: implement
	}

	/**
	 * Take a JSEP offer or answer and generate a barebone SDP the application can use
	 *
	 * @param {string} info opaque string that the user can provide for context; optional
	 * @param {string} srtp whether to mandate (sdes_mandatory) or offer (sdes_optional) SRTP support; optional
	 * @param {string} srtp_profile SRTP profile to negotiate, in case SRTP is offered; optional
	 * @param {boolean} update
	 * @memberof NoSIPPlugin
	 */
	public generate(info: string, srtp: string, srtp_profile: string, update: boolean) {
		// TODO: implement
	}

	/**
	 * Process a remote barebone SDP, and match it to the one we may have generated before
	 *
	 * @param {string} type <offer|answer, depending on the nature of the provided SDP
	 * @param {string} sdp barebone SDP to convert
	 * @param {string} info opaque string that the user can provide for context; optional
	 * @param {string} srtp whether to mandate (sdes_mandatory) or offer (sdes_optional) SRTP support; optional
	 * @param {string} srtp_profile SRTP profile to negotiate, in case SRTP is offered; optional
	 * @param {boolean} update
	 * @memberof NoSIPPlugin
	 */
	public process(type: string, sdp: string, info: string, srtp: string, srtp_profile: string, update: boolean) {
		// TODO: implement
	}

	/**
	 * Start or stop recording
	 *
	 * @param {string} action start|stop, depending on whether you want to start or stop recording something
	 * @param {boolean} audio true|false; whether or not our audio should be recorded
	 * @param {boolean} video true|false; whether or not our video should be recorded
	 * @param {boolean} peer_audio true|false; whether or not our peer's audio should be recorded
	 * @param {boolean} peer_video true|false; whether or not our peer's video should be recorded
	 * @param {string} filename base path/filename to use for all the recordings
	 * @memberof NoSIPPlugin
	 */
	public recording(action: string, audio: boolean, video: boolean, peer_audio: boolean, peer_video: boolean, filename: string) {
		// todo: implement
	}
}