import { WebRTCPeerConnection } from "./WebRTCPeerConnection";
import { WebRTCMediaStream } from "./WebRTCMediaStream";

/**
 * Use to connect a stream from WebRTCMediaSource to a PeerConnection
 */
export class WebRTCPeerMediaConnector {
	constructor(private peerConnection: WebRTCPeerConnection, private localStream: WebRTCMediaStream) {
		this.localStream.mediaStream.getTracks().forEach(track => {
			this.peerConnection.peerConnection.addTrack(track, localStream.mediaStream);
		});

	}


}