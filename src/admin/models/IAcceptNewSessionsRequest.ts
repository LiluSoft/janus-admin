import { IRequest } from "../../transports/IRequest";

export interface IAcceptNewSessionsRequest extends IRequest {
	janus: "accept_new_sessions";
	admin_secret: string;
	accept: boolean;
}