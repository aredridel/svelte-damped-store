/// <reference lib="DOM">

import { get, readable, type Updater, type Writable } from 'svelte/store';

export type DampedStore<T> = Writable<T> & {
	hold: () => void;
	release: () => void;
	timeout: number | undefined;
};

const EMPTY = Symbol('empty');

export function damper<T>(store: Writable<T>, timeout?: number): DampedStore<T> {
	let held = false;
	let set_: (val: T) => void;
	let value: T | typeof EMPTY = EMPTY;

	const methods = {
		set(val: T) {
			return store.set(val);
		},
		update(fn: Updater<T>) {
			return store.update(fn);
		},
		hold,
		release,
		timeout
	};

	function hold() {
		held = true;
	}
	async function release() {
		held = false;
		if (methods.timeout != null) {
			setTimeout(() => {
				if (set_ && value != EMPTY) set_(value);
			}, methods.timeout)
		} else {
			if (set_ && value != EMPTY) set_(value);
		}
	}
	return Object.assign(
		readable(get(store), (set: (val: T) => void) => {
			set_ = set;
			const stop = store.subscribe((val: T) => {
				if (!held) {
					value = EMPTY;
					set(val);
				} else {
					value = val;
				}
			});
			return () => {
				stop();
				held = true;
			};
		}),
		methods
	);
}
export function damperAction<T>(
	el: HTMLElement,
	{
		store = undefined,
		timeout = undefined
	}: { store?: DampedStore<T> | undefined; timeout?: number | undefined }
) {
	setup();

	return {
		destroy,
		update({
			store: store_ = undefined,
			timeout: timeout_ = undefined
		}: {
			store: DampedStore<T> | undefined;
			timeout: number | undefined;
		}) {
			if (timeout_ != null) timeout = timeout_;
			destroy();
			store = store_;
			setup();
		}
	};

	function setup() {
		if (store) {
			store.timeout = timeout;
			el.addEventListener('mousedown', store.hold);
			el.addEventListener('mouseup', store.release);
		}
	}
	function destroy() {
		if (store) {
			store.release();
			el.removeEventListener('mousedown', store.hold);
			el.removeEventListener('mouseup', store.release);
		}
	}
}
