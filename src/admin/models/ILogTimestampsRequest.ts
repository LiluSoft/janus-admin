import { IRequest } from "../../transports/IRequest";

export interface ILogTimestampsRequest extends IRequest {
	janus: "set_log_timestamps";
	timestamps: boolean;
}