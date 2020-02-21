import { IRequest } from "./IRequest";

export interface IRequestWithBody<T> extends IRequest {
	body?: T;
}