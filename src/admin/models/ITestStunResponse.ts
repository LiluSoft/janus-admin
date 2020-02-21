
export interface ITestStunResponse {
	janus: "success";
	transaction?: string;
	public_ip: string;
	public_port: number;
	elapsed: number;
}