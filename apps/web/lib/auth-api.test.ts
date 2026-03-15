import { describe, expect, it, vi } from "vitest";

import { deleteUploadSession, processUploadSession, signIn, startUploadSession } from "./auth-api";

const uploadSessionResponse = {
  upload_session_id: "upload-1",
  profile_id: "profile-1",
  processing_status: "initiated",
  upload_format: "pdf",
  consent_record_ids: ["consent-1"],
  phi_redaction_applied: false,
  raw_upload_retained: false,
  started_at: "2026-03-15T12:00:00Z",
  retryable: true,
  status_detail: "Upload session created.",
  user_message: "Continue by uploading an ECG file for processing.",
};

describe("auth-api upload sessions", () => {
  it("posts upload-session creation payloads in the API contract shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(uploadSessionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await startUploadSession({
      profile_id: "profile-1",
      upload_format: "pdf",
      consent_record_ids: ["consent-1"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/upload-sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          profile_id: "profile-1",
          upload_format: "pdf",
          consent_record_ids: ["consent-1"],
        }),
      }),
    );
  });

  it("posts sign-in credentials without wrapping them in a payload envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          authenticated: true,
          beta_access: "granted",
          user: {
            email: "person@example.com",
            preferred_language: "en-US",
            profile_id: "profile-1",
            role: "user",
            user_id: "user-1",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await signIn({
      email: "person@example.com",
      password: "steadyrhythm2026!",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/auth/sign-in",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          password: "steadyrhythm2026!",
        }),
      }),
    );
  });

  it("accepts empty 204 responses when deleting an upload session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteUploadSession("upload-1")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/upload-sessions/upload-1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("sends optional tile attribution with the multipart process request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(uploadSessionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await processUploadSession({
      upload_session_id: "upload-1",
      file: new File(["ecg"], "trace.pdf", { type: "application/pdf" }),
      processing_pipeline_version: "ecg-contribution-v1",
      tile_attribution: {
        contributor_name: "Matthew",
        contributor_location: "Vermont",
      },
    });

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    expect(request?.body).toBeInstanceOf(FormData);

    const formData = request?.body as FormData;
    expect(formData.get("processing_pipeline_version")).toBe("ecg-contribution-v1");
    expect(formData.get("share_first_name")).toBe("true");
    expect(formData.get("first_name")).toBe("Matthew");
    expect(formData.get("share_location")).toBe("true");
    expect(formData.get("location_label")).toBe("Vermont");
  });
});
