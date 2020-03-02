import { ILogger } from "./ILogger";

export interface ILoggerFactory {
	create(name: string, level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger;
}