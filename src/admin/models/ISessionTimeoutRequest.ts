import { IRequest } from "../../transports/IRequest";

export interface ISessionTimeoutRequest extends IRequest {
	janus: "set_session_timeout";
	transaction?: string;
	admin_secret?: string;
	timeout: number;
}