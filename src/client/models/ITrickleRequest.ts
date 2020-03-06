import { IRequest } from "../../index_browser";

export interface ICandidate {
	"sdpMid": string | null;
	"sdpMLineIndex": number | null;
	"candidate": string;

}

export interface ITrickleRequest extends IRequest{
	janus: "trickle";
	candidate?: ICandidate | {"completed": true};
	candidates?: ICandidate[];
}