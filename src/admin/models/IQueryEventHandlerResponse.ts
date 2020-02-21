export interface IQueryEventHandlerResponse<T> {
	janus: "success";
	transaction?: string;
	response: T;
}