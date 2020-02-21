import * as crypto from 'crypto';

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Transaction Generator
 * Used to generate transaction ids for matching responses with requests
 * You must instantiate a new Transaction instance to get a fresh transaction id
 *
 * @export
 * @class Transaction
 */
export class Transaction {
	private _id: string;
	constructor() {
		this._id = this.generate_random_token(10);
	}

	private generate_random_token(len: number) {
		let value = "";
		const randomBytes = crypto.randomBytes(len);
		for (let i = 0; i < len; i++) {
			value = value + possible[randomBytes[i] % possible.length];
		}
		return value;
	}

	public getTransactionId() {
		return this._id;
	}
}