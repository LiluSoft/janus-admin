// export class JanusExtension {
// 	// Screensharing Chrome Extension ID
// 	public static readonly extensionId = "hapfgfdkleiggjjpfpenajgdnfckjpaj";
// 	private static _screenId: string;
// 	private static _initialize = JanusExtension.init();
// 	private static _results: {
// 		[timerId: string]: {
// 			resolve: (value: string) => void;
// 			reject: (err: Error) => void;
// 		}
// 	} = {};


// 	public static isInstalled() {
// 		return document.querySelector("#janus-extension-installed") !== null;
// 	}



// 	public static async getScreen(): Promise<string> {
// 		if (JanusExtension._screenId) {
// 			return JanusExtension._screenId;
// 		}
// 		return new Promise<string>((resolve, reject) => {
// 			const pending = window.setTimeout(() => {
// 				const error = new Error("NavigatorUserMediaError");
// 				error.name = "The required Chrome extension is not installed: click <a href=\"javascript:void(0)\">here</a> to install it. (NOTE: this will need you to refresh the page)";
// 				reject(error);
// 			}, 1000);

// 			window.postMessage({ type: "janusGetScreen", id: pending }, "*");
// 			JanusExtension._results[pending] = {
// 				resolve,
// 				reject
// 			};
// 		});

// 	}


// 	private static processMessage(event: MessageEvent) {
// 		if (event.origin !== window.location.origin)
// 			return;
// 		if (event.data.type === "janusGotScreen" && JanusExtension._results[event.data.id]) {
// 			const callbacks = JanusExtension._results[event.data.id];
// 			delete JanusExtension._results[event.data.id];

// 			if (event.data.sourceId === "") {
// 				// user canceled
// 				const error = new Error("NavigatorUserMediaError");
// 				error.name = "You cancelled the request for permission, giving up...";
// 				callbacks.reject(error);
// 			} else {
// 				callbacks.resolve(event.data.sourceId);
// 			}
// 		} else if (event.data.type === "janusGetScreenPending") {
// 			// console.log("clearing ", event.data.id);
// 			window.clearTimeout(event.data.id);
// 		}
// 	}

// 	public static init() {
// 		// Wait for events from the Chrome Extension
// 		window.addEventListener("message", JanusExtension.processMessage);
// 		return true;
// 	}
// }