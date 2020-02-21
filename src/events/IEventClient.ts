export interface IEventClient {
	dispose(): Promise<void>;
	waitForReady(): Promise<boolean>;

	subscribe<T>(topic: string, callback: (message: T) => void): Promise<void>;
	publish<T>(topic: string, message: T): Promise<void>;

	onError(errorHandler: (err: Error) => void): Promise<void>
}