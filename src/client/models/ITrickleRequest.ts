import { IRequest } from "../..";

export interface ICandidate {
	"sdpMid": string;
	"sdpMLineIndex": number;
	"candidate": string;

}

export interface ITrickleRequest extends IRequest{
	janus: "trickle";
	candidate?: ICandidate;
	candidates?: ICandidate[];
}