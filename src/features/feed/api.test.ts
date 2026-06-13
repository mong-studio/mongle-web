import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { apiClient, configureAuthClient } from "../../shared/api/client.js";
import { createComment, fetchPostDetail, fetchPosts } from "./api.js";

type AdapterHandler = (config: InternalAxiosRequestConfig) => {
  status: number;
  data: unknown;
};

function useAdapter(handler: AdapterHandler) {
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const { status, data } = handler(config as InternalAxiosRequestConfig);
    return {
      data,
      status,
      statusText: String(status),
      headers: {},
      config: config as InternalAxiosRequestConfig,
    };
  };
}

describe("feed API", () => {
  beforeEach(() => {
    configureAuthClient({
      getAccessToken: () => "test-token",
      refreshSession: async () => false,
      onSessionExpired: () => {},
    });
  });

  describe("fetchPosts", () => {
    it("GET /posts/ 로 포스트 목록을 반환한다", async () => {
      const mockPosts = [
        {
          post_id: "aaa",
          character: "char-1",
          quest_id: "q-1",
          img_url: "https://example.com/img.png",
          content: "테스트 내용",
          is_liked: false,
          comments: [],
          created_at: "2026-06-10T10:00:00Z",
        },
      ];
      let capturedUrl: string | undefined;
      useAdapter((config) => {
        capturedUrl = config.url;
        return { status: 200, data: mockPosts };
      });

      const result = await fetchPosts();

      expect(capturedUrl).toBe("/posts/");
      expect(result).toEqual(mockPosts);
    });

    it("빈 배열도 정상 처리한다", async () => {
      useAdapter(() => ({ status: 200, data: [] }));
      const result = await fetchPosts();
      expect(result).toEqual([]);
    });
  });

  describe("fetchPostDetail", () => {
    it("GET /posts/<id>/ 로 단일 포스트와 댓글을 반환한다", async () => {
      const mockPost = {
        post_id: "bbb",
        character: "char-1",
        quest_id: "q-1",
        img_url: "",
        content: "상세 내용",
        is_liked: true,
        comments: [
          {
            comment_id: "c-1",
            user: "user-1",
            content: "댓글",
            created_at: "2026-06-10T11:00:00Z",
          },
        ],
        created_at: "2026-06-10T10:00:00Z",
      };
      let capturedUrl: string | undefined;
      useAdapter((config) => {
        capturedUrl = config.url;
        return { status: 200, data: mockPost };
      });

      const result = await fetchPostDetail("bbb");

      expect(capturedUrl).toBe("/posts/bbb/");
      expect(result.post_id).toBe("bbb");
      expect(result.comments).toHaveLength(1);
    });

    it("404면 에러를 던진다", async () => {
      useAdapter(() => ({ status: 404, data: {} }));
      await expect(fetchPostDetail("nonexistent")).rejects.toThrow();
    });
  });

  describe("createComment", () => {
    it("POST /posts/<id>/comments/ 로 댓글을 생성한다", async () => {
      const mockComment = {
        comment_id: "c-new",
        user: "user-1",
        content: "새 댓글",
        created_at: "2026-06-10T12:00:00Z",
      };
      let capturedUrl: string | undefined;
      let capturedBody: unknown;
      useAdapter((config) => {
        capturedUrl = config.url;
        capturedBody = JSON.parse(config.data as string);
        return { status: 201, data: mockComment };
      });

      const result = await createComment("bbb", "새 댓글");

      expect(capturedUrl).toBe("/posts/bbb/comments/");
      expect(capturedBody).toEqual({ content: "새 댓글" });
      expect(result.comment_id).toBe("c-new");
    });
  });
});
