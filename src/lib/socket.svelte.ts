import { io } from 'socket.io-client';
import type { SocketClient } from '../../socketio';
import { Context } from 'runed';

export class Socket {
	private socket: SocketClient = io();
	public connected = $state(false);

	constructor() {
		this.socket.on('connect', () => {
			this.connected = true;
		});
		this.socket.on('disconnect', () => {
			this.connected = false;
		});

		this.socket.onAny((event, ...args) => {
			console.log('main:', { event, args });
		});
	}
}

export class UserInput {
	private sock = io('/user-input');
	public connected = $state(false);
	public requests: {
		[id: string]: {
			id: string;
			message: string;
			sessionId: string;
			agentId: string;
			response?: string;
		};
	} = $state({});
	constructor() {
		this.sock.on('connect', () => {
			console.log('user input connected');
			this.connected = true;
		});
		this.sock.on('disconnect', () => {
			console.log('user input disconnected');
			this.connected = false;
		});
		this.sock.onAny((event, ...args) => {
			console.log('user-input:', { event, args });
		});
		this.sock.on('request', (req) => {
			console.log('request', req);
			this.requests[req.id] = req;
		});
	}

	respond(id: string, value: string) {
		this.requests[id].response = value;
		this.sock.emit('response', { id, value });
	}
}
export const socketCtx = new Context<{
	socket: Socket;
	userInput: UserInput;
}>('socketCtx');
