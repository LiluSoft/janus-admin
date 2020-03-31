import { expect } from "chai";
import "mocha";
import { client } from "websocket";
import chai from "chai";
import chaiSubset from "chai-subset";
import { ServerLoggerFactory, JanusSessionEventHandler, ITransport, JanusSession } from "../src/index_server";
chai.use(chaiSubset);
import * as TypeMoq from "typemoq";
import { convertTypeAcquisitionFromJson } from "typescript";
import { IEvent } from "../src/transports/IEvent";
import { doesNotMatch } from "assert";

const loggerFactory = new ServerLoggerFactory();

describe("event client transport", () => {
	it("should run subscribe when calling constructor", () => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.dispose();

		transportMoq.verify(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session), TypeMoq.Times.exactly(1));
	});

	it("should raise keepalive for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_keepalive(() => {
			done();
		});

		eventHandler({ janus: "keepalive", sender: 0, session_id: session.session_id });
	});

	it("should raise trickle for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_trickle(() => {
			done();
		});

		eventHandler({ janus: "trickle", sender: 0, session_id: session.session_id });
	});

	it("should raise webrtcup for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_webrtcup(() => {
			done();
		});

		eventHandler({ janus: "webrtcup", sender: 0, session_id: session.session_id });
	});


	it("should raise media for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_media(() => {
			done();
		});

		eventHandler({ janus: "media", sender: 0, session_id: session.session_id });
	});

	it("should raise slowlink for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_slowlink(() => {
			done();
		});

		eventHandler({ janus: "slowlink", sender: 0, session_id: session.session_id });
	});

	it("should raise hangup for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_hangup(() => {
			done();
		});

		eventHandler({ janus: "hangup", sender: 0, session_id: session.session_id });
	});


	it("should raise detached for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_detached(() => {
			done();
		});

		eventHandler({ janus: "detached", sender: 0, session_id: session.session_id });
	});

	it("should raise timeout for matching event", (done) => {
		const transportMoq = TypeMoq.Mock.ofType<ITransport>();
		const session = new JanusSession(123);
		let eventHandler: (event: IEvent) => void = () => {
			// nop
		};
		transportMoq.setup(v => v.subscribe_plugin_events(TypeMoq.It.isAny(), session)).returns((callback) => {
			eventHandler = callback;
			return () => {
				// nop
			};
		});
		const sessionEventHandler = new JanusSessionEventHandler(loggerFactory, transportMoq.object, session);

		sessionEventHandler.on_timeout(() => {
			done();
		});

		eventHandler({ janus: "timeout", sender: 0, session_id: session.session_id });
	});


});

