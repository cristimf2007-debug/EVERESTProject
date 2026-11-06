import React, { act } from "react";
import { createRoot } from "react-dom/client";
jest.mock("@/lib/utils", () => ({ cn: (...classes) => classes.filter(Boolean).join(" ") }), { virtual: true });
import { Button } from "./button";

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

test("asChild buttons preserve both child and button actions", () => {
  const childAction = jest.fn((event) => event.preventDefault());
  const buttonAction = jest.fn();

  act(() => {
    root.render(
      <Button asChild onClick={buttonAction}>
        <a href="/contact" onClick={childAction}>Contact</a>
      </Button>,
    );
  });
  act(() => container.querySelector("a").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));

  expect(childAction).toHaveBeenCalledTimes(1);
  expect(buttonAction).toHaveBeenCalledTimes(1);
});

test("disabled asChild buttons block navigation and all click handlers", () => {
  const childAction = jest.fn();
  const buttonAction = jest.fn();

  act(() => {
    root.render(
      <Button asChild disabled onClick={buttonAction}>
        <a href="/contact" onClick={childAction}>Contact</a>
      </Button>,
    );
  });
  const link = container.querySelector("a");
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  act(() => link.dispatchEvent(event));

  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(event.defaultPrevented).toBe(true);
  expect(childAction).not.toHaveBeenCalled();
  expect(buttonAction).not.toHaveBeenCalled();
});
