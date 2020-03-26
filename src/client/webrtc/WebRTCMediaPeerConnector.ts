import { WebRTCMediaStream, WebRTCPeerConnection } from ".";

/**
 * Use to connect a PeerConnection to a local MediaStream output
 */
export class WebRTCMediaPeerConnector {
	constructor(private remoteStream: WebRTCMediaStream, private peerConnection: WebRTCPeerConnection) {
		this.peerConnection.peerConnection.addEventListener("track", (event) => {
			this.remoteStream.mediaStream.addTrack(event.track);
		});
	}
}