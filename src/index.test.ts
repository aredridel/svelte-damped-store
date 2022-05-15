import { writable } from "svelte/store";
import { test, expect, describe, vi } from "vitest";

import { damper, damperAction } from "./index";

describe("store", () => {
  test("timeout is reflected", async () => {
    const innerStore = writable({});

    {
      const damped = damper(innerStore, 100);
      expect(damped.timeout).toBe(100);
    }

    {
      const damped = damper(innerStore);
      expect(damped.timeout).toBe(undefined);
    }
  });

  test("core", async () => {
    const innerStore = writable(0);

    let dampedValue;
    const damped = damper(innerStore);
    damped.subscribe((v) => (dampedValue = v));

    innerStore.set(1);
    expect(dampedValue).toBe(1);

    damped.hold();

    innerStore.set(2);
    expect(dampedValue).toBe(1);

    damped.release();
    expect(dampedValue).toBe(2);
  });

  test("the latest inner value is reflected after release", async () => {
    const innerStore = writable(2);

    let dampedValue;
    const damped = damper(innerStore);
    damped.subscribe((v) => (dampedValue = v));

    damped.hold();
    expect(dampedValue).toBe(2);

    innerStore.set(3);
    innerStore.set(4);

    expect(dampedValue).toBe(2);
    damped.release();
    expect(dampedValue).toBe(4);
  });

  test("damped write sets inner value immediately, and updates itself on release", async () => {
    let innerValue;
    const innerStore = writable(4);
    innerStore.subscribe((v) => (innerValue = v));

    let dampedValue;
    const damped = damper(innerStore);
    damped.subscribe((v) => (dampedValue = v));
    damped.hold();

    innerStore.set(5);
    damped.set(6);
    expect(innerValue).toBe(6);
    expect(dampedValue).toBe(4);

    damped.release();

    expect(dampedValue).toBe(6);
  });

  test("damped write sets inner value immediately, and updates itself on release", async () => {
    let innerValue;
    const innerStore = writable(6);
    innerStore.subscribe((v) => (innerValue = v));

    let dampedValue;
    const damped = damper(innerStore);
    damped.subscribe((v) => (dampedValue = v));
    damped.hold();

    damped.set(7);
    innerStore.set(8);

    expect(innerValue).toBe(8);
    expect(dampedValue).toBe(6);

    damped.release();

    expect(dampedValue).toBe(8);
  });

  test("damped write with a timeout releases after time", async () => {
    let innerValue;

    vi.useFakeTimers();

    const innerStore = writable(0);
    innerStore.subscribe((v) => (innerValue = v));

    let dampedValue;
    const damped = damper(innerStore, 100);
    damped.subscribe((v) => (dampedValue = v));

    damped.hold();

    innerStore.set(10);

    expect(innerValue).toBe(10);
    expect(dampedValue).toBe(0);

    damped.release();

    expect(dampedValue).toBe(0);

    vi.advanceTimersByTime(101);

    expect(dampedValue).toBe(10);
  });
});

describe("action", () => {
  test("timeout is reflected", async () => {
    const host = document.createElement("button");
    host.setAttribute("id", "host");
    document.body.appendChild(host);
    try {
      const innerStore = writable({});

      const damped = damper(innerStore);

      const done = damperAction(host, { store: damped, timeout: 100 });

      expect(damped.timeout).toBe(100);

      done.destroy();
    } finally {
      host.remove();
    }
  });
  test("core", async () => {
    const host = document.createElement("button");
    host.setAttribute("id", "host");
    document.body.appendChild(host);
    try {
      const innerStore = writable(0);

      let dampedValue;
      const damped = damper(innerStore);
      damped.subscribe((val) => (dampedValue = val));

      const done = damperAction(host, { store: damped });

      host.dispatchEvent(new MouseEvent("mousedown"));

      innerStore.set(1);

      expect(dampedValue).toBe(0);

      host.dispatchEvent(new MouseEvent('mouseup'));

      expect(dampedValue).toBe(1);

      done.destroy();

      host.dispatchEvent(new MouseEvent("mousedown"));

      innerStore.set(2);

      expect(dampedValue).toBe(2);

      host.dispatchEvent(new MouseEvent('mouseup'));

      expect(dampedValue).toBe(2);
    } finally {
      host.remove();
    }
  });
});
