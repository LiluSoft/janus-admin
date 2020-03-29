// import { Injectable, OnDestroy } from "@angular/core";
// import { Observable } from "rxjs";
// import { LoggerService, Logger } from "../logger/logger.service";

// declare var webkitAudioContext: any;

// export interface IAudioAnalyzerOptions {
// 	interval: number;
// 	threshold: number;
// }

// export interface IAudioDetection {
// 	detected: boolean;
// 	speaking: boolean;
// }

// /**
//  * Audio Analyzer Service
//  * uses FFT to detect speech
//  *
//  * @export
//  * @class AudioAnalyzerService
//  * @implements {OnDestroy}
//  */
// @Injectable({
// 	providedIn: "root"
// })
// export class AudioAnalyzerService implements OnDestroy {
// 	private logger: Logger;
// 	constructor(
// 		private loggerService: LoggerService
// 	) {
// 		this.logger = this.loggerService.getLoggerColor("AudioAnalyzerService", "#BBBB10");
// 		this.logger.info("Initialization")();
// 	}

// 	public subscribeAnalyzer(stream: MediaStream, options?: Partial<IAudioAnalyzerOptions>) {
// 		this.logger.info("Subscribing to analyzer", stream, options)();
// 		return new Observable<IAudioDetection>(observer => {
// 			options = options || {};
// 			const interval = options.interval || 65;
// 			const threshold = options.threshold || -50;

// 			const audioContext: AudioContext = this.createAudioContext();
// 			// const AudioContextType: AudioContext = AudioContext || webkitAudioContext;
// 			// const audioContext = new AudioContextType();

// 			// Setup an analyser
// 			const analyser = audioContext.createAnalyser();
// 			analyser.fftSize = 512;
// 			analyser.smoothingTimeConstant = 0.1;
// 			const fftBins = new Float32Array(analyser.fftSize);
// 			// Setup a source node and connect it to the analyser
// 			const sourceNode = audioContext.createMediaStreamSource(stream);
// 			sourceNode.connect(analyser);

// 			let speaking = false;
// 			let lastAudioDetected = false;
// 			let lastSpeaking = false;
// 			const history = new Array(10).fill(0);

// 			const loop = setInterval(() => {
// 				// No clue why, but in some situations (which seems to be different in
// 				// every browser) audioContext is suspended.
// 				//
// 				// For that reason, using a ScriptProcessor is unreliable and we have to
// 				// use $timeout, including this code to manually wake up the context
// 				if (audioContext.state === "suspended") {
// 					audioContext.resume();
// 				} else {
// 					const audioDetected = this.isAudioDetected(analyser, fftBins, threshold);
// 					let sum;

// 					if (audioDetected && !speaking) {
// 						// Make sure we have been above the threshold in, at least, 2 of the 3
// 						// previous iterations
// 						sum = history.slice(history.length - 3).reduce((a, b) => a + b, 0);
// 						if (sum >= 2) {
// 							speaking = true;
// 						}
// 					} else if (!audioDetected && speaking) {
// 						// Make sure we have been below the threshold for the whole history
// 						// (i.e. 10 iterations)
// 						sum = history.reduce((a, b) => a + b, 0);
// 						if (sum === 0) {
// 							speaking = false;
// 						}
// 					}
// 					history.shift();
// 					history.push((audioDetected) ? 1 : 0);

// 					// if there is a change in states, push an update
// 					if ((lastSpeaking !== speaking) || (lastAudioDetected !== audioDetected)) {
// 						lastSpeaking = speaking;
// 						lastAudioDetected = audioDetected;

// 						observer.next({
// 							detected: lastAudioDetected,
// 							speaking: lastSpeaking
// 						});
// 					}
// 				}



// 			}, interval);

// 			return {
// 				unsubscribe() {
// 					// TODO:!!!!!why is it null?!?!
// 					// this.logger.info('Unsubscribing from analyzer', stream, options)();
// 					clearInterval(loop);
// 				}
// 			};
// 		});
// 	}


// 	private createAudioContext() {
// 		let audioContext: AudioContext;
// 		if (AudioContext) {
// 			audioContext = new AudioContext();
// 		} else if (webkitAudioContext) {
// 			audioContext = new webkitAudioContext();
// 		}
// 		return audioContext;
// 	}

// 	ngOnDestroy(): void {

// 	}

// 	private isAudioDetected(analyser: AnalyserNode, fftBins: Float32Array, threshold: number) {
// 		analyser.getFloatFrequencyData(fftBins);
// 		// Skip the first 4... simply because hark does it
// 		// (too low frequencies to be voice, I guess)
// 		for (let i = 4, ii = fftBins.length; i < ii; i++) {
// 			if (fftBins[i] > threshold && fftBins[i] < 0) {
// 				return true;
// 			}
// 		}
// 		return false;
// 	}
// }
