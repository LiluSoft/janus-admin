export class JanusError extends Error {
	constructor(public code: number, private reason: string, public stack?: string) {
		super(reason);
		if (stack) {
			this.stack = this.stack + stack;
		}
	}
}