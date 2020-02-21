
/**
 * take a JSEP offer or answer, and generates a barebone SDP the "legacy" application can use
 *
 * @export
 * @interface IGenerateRequest
 */
export interface IGenerateRequest {
	request: "generate",
	/**
	 * opaque string that the user can provide for context; optional
	 *
	 * @type {string}
	 * @memberof IGenerateRequest
	 */
	info?: string;

	/**
	 * whether to mandate (sdes_mandatory) or offer (sdes_optional) SRTP support; optional
	 *
	 * @type {string}
	 * @memberof IGenerateRequest
	 */
	srtp?: string;


	/**
	 *  SRTP profile to negotiate, in case SRTP is offered; optional
	 *
	 * @type {string}
	 * @memberof IGenerateRequest
	 */
	srtp_profile?: string;

	update: boolean;
}