import { IRequest } from "../../transports/IRequest";

export interface IPcapRequest extends IRequest {
	janus: "start_pcap" | "start_text2pcap";
	folder: string;
	filename: string;
	truncate: number;
}