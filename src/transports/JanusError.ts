export class JanusError extends Error {
	constructor(private code: number, private reason: string, public stack: string) {
		super(reason);
		this.stack = this.stack + stack;
	}
}