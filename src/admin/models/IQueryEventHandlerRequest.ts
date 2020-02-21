import { IRequest } from "../../transports/IRequest";

export interface IQueryEventHandlerRequest<T> extends IRequest {
	janus: "query_eventhandler";
	handler: string;
	request: T;
}