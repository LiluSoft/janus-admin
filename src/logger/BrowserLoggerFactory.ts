import { ILoggerFactory } from "./ILoggerFactory";
import { ILogger } from "./ILogger";
import { BrowserLogger } from "./BrowserLogger";
import { Transaction } from "../abstractions";

export class BrowserLoggerFactory implements ILoggerFactory {
	constructor(public defaultLevel:"trace" | "debug" | "info" | "warn" | "error" | "fatal" = "info"){

	}
	public create(name: string, level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		const transaction = new Transaction(5);

		return BrowserLogger.create(`${name}/${transaction.getTransactionId()}`,level || this.defaultLevel);
	}
}