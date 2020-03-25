// import * as crypto from "crypto";

const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Transaction Generator
 * Used to generate transaction ids for matching responses with requests
 *
 * You must instantiate a new Transaction instance to get a fresh transaction id
 *
 * ```TypeScript
 * const transaction = new Transaction();
 * console.log(transaction.getTransactionId());
 * assert(transaction.getTransactionId() == transaction.getTransactionId());
 * ```
 *
 * @export
 * @class Transaction
 */
export class Transaction {
	private _id: string;
	/**
	 * Creates an instance of Transaction and initializes a random transactionId
	 * @memberof Transaction
	 */
	constructor(len: number = 10) {
		this._id = this.generate_random_token(len);
	}

	private generate_random_token(len: number) {
		let value = "";
		const randomBytes = [...Array(len)].map(v =>Math.random() * 0xFFFFF << 0);
		// crypto.randomBytes(len);
		for (let i = 0; i < len; i++) {
			value = value + possible[randomBytes[i] % possible.length];
		}
		return value;
	}

	/**
	 * Returns the generated TransactionId
	 *
	 * @returns
	 * @memberof Transaction
	 */
	public getTransactionId() {
		return this._id;
	}
}