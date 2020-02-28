import { Transaction } from "../abstractions/Transaction";
import { Session } from "inspector";

/**
 * Deferred Promise
 * Handles Matching Promises with queued responses while maintaining a stack trace
 *
 * @export
 * @class DeferredPromise
 * @template T
 */
export class DeferredPromise<T>{
	public promise: Promise<T>;
	public resolve: (result: T) => void;
	public reject: (err: Error) => void;
	public transaction?: Transaction;
	public session?: Session;
	public stack?: string;
	public ignore_ack: boolean;

	public static async create<T>(transaction?: Transaction, session?: Session, ignore_ack?: boolean) {
		const err = new Error();
		// return err.stack;
		return new Promise<DeferredPromise<T>>((resolveDeferred) => {

			const promise = new DeferredPromise<T>();
			promise.promise = new Promise<T>((resolve, reject) => {
				promise.ignore_ack = ignore_ack || true;
				promise.stack = err.stack;
				promise.resolve = resolve;
				promise.reject = reject;
				promise.transaction = transaction;
				promise.session = session;
				resolveDeferred(promise);
			});

		});
	}
}