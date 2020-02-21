export interface IProcessRequest {
	"request": "process";
	/**
	 * offer|answer, depending on the nature of the provided SDP
	 */
	"type": string;
	/**
	 * barebone SDP to convert
	 */
	"sdp": string;
	/**
	 * opaque string that the user can provide for context; optional
	 */
	"info": string;
	/**
	 * whether to mandate (sdes_mandatory) or offer (sdes_optional) SRTP support; optional
	 */
	"srtp": string;
	/**
	 * SRTP profile to negotiate, in case SRTP is offered; optional
	 */
	"srtp_profile": string;
}