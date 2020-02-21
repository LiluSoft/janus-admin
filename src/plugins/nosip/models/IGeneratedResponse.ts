export interface IGeneratedResponse {
	event: "generated";
	/**
	 * offer|answer, depending on the nature of the provided JSEP
	 *
	 * @type {string}
	 * @memberof IGeneratedResponse
	 */
	type: string;

	/**
	 * barebone SDP content
	 *
	 * @type {string}
	 * @memberof IGeneratedResponse
	 */
	sdp: string;
}