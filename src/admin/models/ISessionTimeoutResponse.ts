
export interface ISessionTimeoutResponse {
	janus: "success";
	transaction?: string;
	timeout: number;
}