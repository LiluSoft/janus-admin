export interface IErrorResponse {
	plugin: string;
	data: {
		/**
		 * numeric ID, check Macros below
		 */
		"error_code"?: number;
		/**
		 * error description as a string
		 */
		"error"?: string;
	};
}