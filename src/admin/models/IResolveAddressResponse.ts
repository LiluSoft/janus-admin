export interface IResolveAddressResponse {
	janus: "success";
	transaction?: string;
	ip: string;
	elapsed: number;
}