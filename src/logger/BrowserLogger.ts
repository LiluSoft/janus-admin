import { ILogger } from "./ILogger";

export class BrowserLogger implements ILogger {
	trace(format: any, ...params: any[]): void {
		throw new Error("Method not implemented.");
	}
	debug(format: any, ...params: any[]): void {
		throw new Error("Method not implemented.");
	}
	info(format: any, ...params: any[]): void {
		throw new Error("Method not implemented.");
	}
	warn(format: any, ...params: any[]): void {
		throw new Error("Method not implemented.");
	}
	error(format: any, ...params: any[]): void {
		throw new Error("Method not implemented.");
	}
	fatal(format: any, ...params: any[]): void {
		throw new Error("Method not implemented.");
	}
	private readonly _levels = ["trace", "debug", "info", "warn", "error", "fatal"];

	private mockConsole: Console;



	private dummy() {
		// Do Nothing
	}

	private getLevel(level: string) {
		return level.toUpperCase();
	}

	public getColorStyle(color: string) {
		return `color: white; background-color: ${color}; padding: 2px 6px; border-radius: 2px; font-size: 10px`;
	}
	// tslint:disable-next-line:ban-types
	private getSingleLogger(initiator: string, style: string, fn: Function, level: string) {
		return (...args1: any[]) => {
			if (this._levels.indexOf(this.level) > this._levels.indexOf(level)) {
				return this.dummy;
			}
			const args = Array.prototype.slice.call(args1);
			let params = [this.mockConsole, `${(new Date()).toISOString()}[${this.getLevel(level)}]%c[${initiator}]`, style];
			params = params.concat(args);
			return Function.prototype.bind.apply(fn, params);
		};
	}

	private constructor(private name: string, private level: "trace" | "debug" | "info" | "warn" | "error" | "fatal") {
		this.mockConsole = console;

		this.trace = this.getSingleLogger(name, this.getColorStyle("blue"), this.mockConsole.log, "trace");
		this.debug = this.getSingleLogger(name, this.getColorStyle("gray"), this.mockConsole.log, "debug");
		this.info = this.getSingleLogger(name, this.getColorStyle("white"), this.mockConsole.log, "info");
		this.warn = this.getSingleLogger(name, this.getColorStyle("pink"), this.mockConsole.warn, "warn");
		this.error = this.getSingleLogger(name, this.getColorStyle("red"), this.mockConsole.error, "error");
	}
	public static create(name: string, level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		const newLogger = new BrowserLogger(name, level);
		return newLogger;
	}
}
