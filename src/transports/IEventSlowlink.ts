import { IEvent } from "./IEvent";

/**
 * whether Janus is reporting trouble sending/receiving (uplink: true/false) media on this PeerConnection
 */
export interface IEventSlowlink extends IEvent {
	janus: "slowlink";
	uplink: boolean;
	lost: number;
	/**
	 * number of NACKs in the last second
	 */
	nacks: number;
}