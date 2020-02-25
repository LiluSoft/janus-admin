import { IRequest } from "./IRequest";

export interface IRequestWithJSEP extends IRequest {
	jsep?: any;
}