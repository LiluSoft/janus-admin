import { IRequest } from "../../transports/IRequest";

export interface ISetLogLevelRequest extends IRequest {
	janus: "set_log_level";
	transaction?: string;
	admin_secret?: string;
	level: number;
}