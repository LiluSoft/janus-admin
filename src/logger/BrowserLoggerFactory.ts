import { ILoggerFactory } from "./ILoggerFactory";
import { ILogger } from "./ILogger";
import { BrowserLogger } from "./BrowserLogger";

export class BrowserLoggerFactory implements ILoggerFactory {
	public create(name: string, level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		return BrowserLogger.create(name,level);
	}
}