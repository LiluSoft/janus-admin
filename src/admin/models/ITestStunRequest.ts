import { IRequest } from "../../transports/IRequest";

export interface ITestStunRequest extends IRequest {
	janus: "test_stun";
	address: string;
	port: number;
	localport?: number;
}