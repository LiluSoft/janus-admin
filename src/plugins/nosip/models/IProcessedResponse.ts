export interface IProcessedResponse {
	"event": "processed";
	/**
	 * whether the barebone SDP mandates (sdes_mandatory) or offers (sdes_optional) SRTP support; optional
	 */
	"srtp": string;
}