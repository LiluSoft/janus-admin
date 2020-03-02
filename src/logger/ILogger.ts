export interface ILogger {
	/**
	 * Uses `util.format` for msg formatting.
	 */
	trace(format: any, ...params: any[]): void;

	/**
	 * Uses `util.format` for msg formatting.
	 */
	debug(format: any, ...params: any[]): void;

	/**
	 * Uses `util.format` for msg formatting.
	 */
	info(format: any, ...params: any[]): void;

	/**
	 * Uses `util.format` for msg formatting.
	 */
	warn(format: any, ...params: any[]): void;



	/**
	 * Uses `util.format` for msg formatting.
	 */
	error(format: any, ...params: any[]): void;

	/**
	 * Uses `util.format` for msg formatting.
	 */
	fatal(format: any, ...params: any[]): void;
}
