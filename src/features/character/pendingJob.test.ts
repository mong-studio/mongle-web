import { afterEach, describe, expect, it } from "vitest";

import { clearPendingJob, hasPendingJob, loadPendingJob, savePendingJob } from "./pendingJob.js";

const SAMPLE = { jobId: "job-1", name: "몽이", persona: "느긋한 곰" };

afterEach(() => {
  localStorage.clear();
});

describe("pendingJob 저장소", () => {
  it("저장한 잡을 그대로 다시 읽는다", () => {
    savePendingJob(SAMPLE);
    expect(loadPendingJob()).toEqual(SAMPLE);
    expect(hasPendingJob()).toBe(true);
  });

  it("저장된 잡이 없으면 null 을 반환한다", () => {
    expect(loadPendingJob()).toBeNull();
    expect(hasPendingJob()).toBe(false);
  });

  it("clear 후에는 잡이 사라진다", () => {
    savePendingJob(SAMPLE);
    clearPendingJob();
    expect(loadPendingJob()).toBeNull();
    expect(hasPendingJob()).toBe(false);
  });

  it("깨진 JSON 은 null 로 안전하게 처리한다", () => {
    localStorage.setItem("mongle:pendingCharacterJob", "{not json");
    expect(loadPendingJob()).toBeNull();
  });

  it("필수 필드가 빠진 값은 null 로 처리한다", () => {
    localStorage.setItem("mongle:pendingCharacterJob", JSON.stringify({ jobId: "job-1" }));
    expect(loadPendingJob()).toBeNull();
  });
});
