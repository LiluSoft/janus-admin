import { Transaction } from "../abstractions/transaction";
import { Session } from "inspector";

export class DeferredPromise<T>{
	public promise: Promise<T>;
	public resolve: (result: T) => void;
	public reject: (err: Error) => void;
	public transaction: Transaction;
	public session: Session;
	public stack: string;

	// constructor(promise : Promise<T>,
	//      resolve : (result:T)=>void,
	//      reject : (err:Error)=>void,
	//      transaction: Transaction,
	//      session: Session){
	//          this.promise = promise;
	//          this.resolve = resolve;
	//          this.reject = reject;
	//          this.transaction = transaction;
	//          this.session = session;
	//      }

	public static async create<T>(transaction?: Transaction, session?: Session) {
		const err = new Error();
		// return err.stack;
		return new Promise<DeferredPromise<T>>((resolveDeferred, rejectDefered) => {

			const promise = new DeferredPromise<T>();
			promise.promise = new Promise<T>((resolve, reject) => {
				promise.stack = err.stack;
				promise.resolve = resolve;
				promise.reject = reject;
				promise.transaction = transaction;
				promise.session = session;
				resolveDeferred(promise);
			});

		})
	}
}