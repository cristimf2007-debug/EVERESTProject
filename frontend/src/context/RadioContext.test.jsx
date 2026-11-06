import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { RadioProvider, useRadio } from "./RadioContext";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  mediaUrl: (url) => url,
  getSid: () => "test-session",
}), { virtual: true });

const track = { id: "test-track", title: "Test", audio_url: "/test.mp3" };
let controller;
function Probe() { controller = useRadio(); return null; }

let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  api.get.mockImplementation((url) => Promise.resolve({ data:
    url === "/radio/now" ? { track, position: 0 } :
    url === "/tracks" ? [track] : { url: "/test.mp3" }
  }));
  api.post.mockResolvedValue({ data: { listeners: 0 } });
  jest.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

async function mount() {
  await act(async () => root.render(<RadioProvider><Probe /></RadioProvider>));
}

test("radio polling leaves audio unloaded and player intent false", async () => {
  await mount();
  expect(controller.current.id).toBe(track.id);
  expect(controller.hasPlaybackIntent).toBe(false);
  expect(container.querySelector("audio").getAttribute("src")).toBeNull();
  expect(HTMLMediaElement.prototype.load).not.toHaveBeenCalled();
});

test("explicit radio play loads audio and retains player intent after pause", async () => {
  await mount();
  await act(async () => controller.play());
  expect(controller.hasPlaybackIntent).toBe(true);
  expect(container.querySelector("audio").getAttribute("src")).toBe("/test.mp3");
  await act(async () => controller.pause());
  expect(controller.status).toBe("paused");
  expect(controller.hasPlaybackIntent).toBe(true);
});

test("on-demand playback activates contextual player", async () => {
  await mount();
  await act(async () => controller.playTrack(track));
  expect(controller.mode).toBe("track");
  expect(controller.hasPlaybackIntent).toBe(true);
  expect(container.querySelector("audio").getAttribute("src")).toBe("/test.mp3");
});
