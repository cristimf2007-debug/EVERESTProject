import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Protection from "./Protection";

let container;
let root;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test("ignores keydown events without a string key", () => {
  act(() => root.render(<Protection />));
  const event = new KeyboardEvent("keydown", { bubbles: true });
  Object.defineProperty(event, "key", { value: undefined });

  expect(() => document.dispatchEvent(event)).not.toThrow();
  expect(event.defaultPrevented).toBe(false);
});

test("continues blocking configured shortcut keys", () => {
  act(() => root.render(<Protection />));
  const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true, cancelable: true });

  document.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
});
