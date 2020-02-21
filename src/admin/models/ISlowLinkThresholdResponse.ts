
export interface ISlowLinkThresholdResponse {
	janus: "success";
	transaction?: string;
	slowlink_threshold: number;
}