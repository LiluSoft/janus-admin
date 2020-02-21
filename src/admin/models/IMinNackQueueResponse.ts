export interface IMinNackQueueResponse {
	janus: "success";
	transaction?: string;
	min_nack_queue?: number;
}