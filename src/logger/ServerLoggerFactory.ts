import { ILoggerFactory } from "./ILoggerFactory";
import { ILogger } from "./ILogger";
import { BunyanLogger } from "./BunyanLogger";

export class ServerLoggerFactory implements ILoggerFactory {
	constructor(public defaultLevel:"trace" | "debug" | "info" | "warn" | "error" | "fatal" ){

	}

	create(name: string, level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		return BunyanLogger.create(name,level || this.defaultLevel);
	}

}