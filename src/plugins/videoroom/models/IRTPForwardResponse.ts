import { IRTPStream } from "./IRTPStream";

export interface IRTPForwardResponse {
	"videoroom": "rtp_forward",
	/**
	 * unique numeric ID, same as request
	 */
	"room": number;
	/**
	 * unique numeric ID, same as request
	 */
	"publisher_id": number;
	"rtp_stream": IRTPStream;
}