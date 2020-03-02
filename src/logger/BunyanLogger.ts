import bunyanLogger from "bunyan";
import { ILogger } from "./ILogger";

export class BunyanLogger implements ILogger {

	public trace = this.logger.trace.bind(this.logger);
	public debug = this.logger.debug.bind(this.logger);
	public info = this.logger.info.bind(this.logger);
	public warn = this.logger.warn.bind(this.logger);
	public error = this.logger.error.bind(this.logger);
	public fatal = this.logger.fatal.bind(this.logger);

	private constructor(private logger: bunyanLogger) {

	}
	public static create(name: string, level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		const newLogger = new BunyanLogger(bunyanLogger.createLogger({ name, level  }));
		return newLogger;
	}
}
