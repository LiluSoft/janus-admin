import { ILogger } from "./ILogger";
import { BrowserLoggerObject } from "./BrowserLoggerObject";
import { ColorGenerator } from "./ColorGenerator";

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

	private dummy() {
		// Do Nothing
	}

	private getLevel(level: string) {
		return level.toUpperCase();
	}

	public getColorStyle(color: string) {
		const colorGen = new ColorGenerator();
		color = colorGen.colourNameToHex(color);
		return `color: ${colorGen.getContrastYIQ(color)}; background-color: ${color}; padding: 2px 4px; border-radius: 2px; font-size: 10px`;
	}

	public getColorByHash(value:string){
		const colorGen = new ColorGenerator();
		const hashColor = "#" + colorGen.hashFnv32a(value,true,0);
		return `color: ${hashColor}`;
	}

	private constructor(private name: string, private level: "trace" | "debug" | "info" | "warn" | "error" | "fatal") {
		this.trace = console.log.bind(window.console, `%s%c[%s]%c[%s]`, BrowserLoggerObject(),this.getColorByHash(this.name), this.name, this.getColorStyle("blue"), "TRACE");
		this.debug = console.log.bind(window.console, `%s%c[%s]%c[%s]`, BrowserLoggerObject(),this.getColorByHash(this.name), this.name, this.getColorStyle("gray"), "DEBUG");
		this.info = console.log.bind(window.console, `%s%c[%s]%c[%s]`, BrowserLoggerObject(),this.getColorByHash(this.name), this.name, this.getColorStyle("black"), "INFO");
		this.warn = console.log.bind(window.console, `%s%c[%s]%c[%s]`, BrowserLoggerObject(),this.getColorByHash(this.name), this.name, this.getColorStyle("pink"), "WARN");
		this.error = console.log.bind(window.console, `%s%c[%s]%c[%s]`, BrowserLoggerObject(),this.getColorByHash(this.name), this.name, this.getColorStyle("red"), "ERROR");
	}
	public static create(name: string, level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): ILogger {
		const newLogger = new BrowserLogger(name, level);
		return newLogger;
	}
}
