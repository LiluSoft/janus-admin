export class AudioBridgePlugin {
	public create() {
		throw new Error("Not Implemented");
	}

	public edit() {
		throw new Error("Not Implemented");
	}

	public destroy() {
		throw new Error("Not Implemented");
	}

	/**
	 * List all rooms (but private ones) and their details (except for the secret, of course...)
	 */
	public list() {
		throw new Error("Not Implemented");
	}

	/**
	 * Check whether a given room exists or not, returns true/false
	 */
	public exists() {
		throw new Error("Not Implemented");
	}

	/**
	 *  edit the list of allowed participants in an existing audiobridge room
	 */
	public allowed() {
		throw new Error("Not Implemented");
	}

	/**
	 * mute a participant from an existing audiobridge room
	 */
	public mute() {
		throw new Error("Not Implemented");
	}

	/**
	 * unmute a participant from an existing audiobridge room
	 */
	public unmute() {
		throw new Error("Not Implemented");
	}

	/**
	 * kick a participant from an existing audiobridge room
	 */
	public kick() {
		throw new Error("Not Implemented");
	}

	/**
	 * List all participants in a room
	 */
	public listparticipants() {
		throw new Error("Not Implemented");
	}

	/**
	 * Mark the Opus decoder for the participant invalid and recreate it
	 */
	public resetdecoder() {
		throw new Error("Not Implemented");
	}

	public rtp_forward() {
		throw new Error("Not Implemented");
	}

	public stop_rtp_forward() {
		throw new Error("Not Implemented");
	}

	/**
	 *  List all forwarders in a room
	 */
	public listforwarders() {
		throw new Error("Not Implemented");
	}
}