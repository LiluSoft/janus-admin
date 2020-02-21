export interface IErrorResponse {
	janus: "error";
	transaction: string;
	error: {
		code: number;
		reason: string;
	}
}