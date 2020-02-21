import { IRequest } from "../../transports/IRequest";

export interface ISlowLinkThresholdRequest extends IRequest {
	janus: "set_slowlink_threshold";
	slowlink_threshold: number;
}