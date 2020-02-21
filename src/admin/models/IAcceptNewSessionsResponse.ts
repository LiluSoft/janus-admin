
export interface IAcceptNewSessionsResponse {
	janus: "success";
	transaction?: string;
	accept? : boolean;
}