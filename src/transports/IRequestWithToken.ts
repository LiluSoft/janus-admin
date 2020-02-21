import { IRequest } from "./IRequest";

export interface IRequestWithToken extends IRequest {
	plugins?: string[];
	token?: string;
}