import { ILoggerFactory } from "./ILoggerFactory";
import { ILogger } from "./ILogger";
import { BunyanLogger } from "./BunyanLogger";

export class ServerLoggerFactory implements ILoggerFactory {
	create(name: string, level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		return BunyanLogger.create(name,level);
	}

}