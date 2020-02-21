import { IRequest } from "../../transports/IRequest";

export interface IMinNackQueueRequest extends IRequest {
	janus: "set_min_nack_queue";
	min_nack_queue: number;
}