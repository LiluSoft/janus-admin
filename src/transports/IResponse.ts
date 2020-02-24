export interface IResponse<T> {
	janus: string;
	transaction: string;
	data?: T;
}