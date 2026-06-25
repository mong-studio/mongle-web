import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import type { Resident } from "../../app/model/appTypes.js";
import { apiClient } from "../../shared/api/client.js";
import { withdrawAccount } from "../auth/api.js";
import { MyPageModal } from "./MyPage.js";

type UserProfile = {
  user_name: string;
  email: string;
  job: string;
  birth: string | null;
  token_balance: number;
  created_at?: string;
  login_type: string;
};

type Props = {
  fallbackUserName: string;
  residents: Resident[];
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  onNotice: (msg: string) => void;
  onMoveOut: (characterId: string) => void;
};

export function MyPageWrapper({
  fallbackUserName,
  residents,
  onClose,
  onLogout,
  onNotice,
  onMoveOut,
}: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    apiClient
      .get<UserProfile>("/auth/me/")
      .then((res) => setUserProfile(res.data))
      .catch(() => onNotice("프로필 정보를 불러오지 못했어요."));
  }, [onNotice]);

  async function handleWithdraw(password?: string) {
    // 실패는 throw 해서 탈퇴 모달이 토스트로 안내하게 한다. 성공 시 로그아웃·마이페이지 닫기.
    try {
      await withdrawAccount(password);
    } catch (error) {
      if (isAxiosError(error)) {
        const code = (error.response?.data as { error?: { message?: string } } | undefined)?.error
          ?.message;
        if (code && PASSWORD_ERROR_MESSAGES[code]) {
          throw new Error(PASSWORD_ERROR_MESSAGES[code]);
        }
      }
      throw error instanceof Error ? error : new Error("탈퇴에 실패했어요.");
    }
    await onLogout();
    onClose();
    onNotice("계정이 탈퇴됐어요.");
  }

  async function handleUpdateProfile(nickname: string, job: string, birth: string) {
    try {
      const { data } = await apiClient.patch<UserProfile>("/auth/me/", {
        user_name: nickname,
        job,
        birth: birth || null,
      });
      setUserProfile(data);
      onNotice("프로필이 수정됐어요.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "프로필 수정에 실패했어요.");
    }
  }

  const PASSWORD_ERROR_MESSAGES: Record<string, string> = {
    INVALID_CURRENT_PASSWORD: "현재 비밀번호가 올바르지 않아요.",
    VALIDATION_ERROR: "입력값을 다시 확인해 주세요.",
  };

  async function handleUpdatePassword(current: string, next: string) {
    try {
      await apiClient.post("/auth/change-password/", {
        current_password: current,
        new_password: next,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const code = (error.response?.data as { error?: { message?: string } } | undefined)?.error
          ?.message;
        if (code && PASSWORD_ERROR_MESSAGES[code]) {
          throw new Error(PASSWORD_ERROR_MESSAGES[code]);
        }
      }
      throw error;
    }
    // 비밀번호 변경 후에는 보안을 위해 로그아웃해 재로그인하도록 한다.
    await onLogout();
  }

  return (
    <MyPageModal
      userName={userProfile?.user_name ?? fallbackUserName}
      userEmail={userProfile?.email ?? ""}
      userJob={userProfile?.job ?? ""}
      userBirth={userProfile?.birth ?? ""}
      tokenBalance={userProfile?.token_balance ?? 0}
      joinDate={userProfile?.created_at ?? ""}
      residents={residents}
      onClose={onClose}
      onWithdraw={handleWithdraw}
      onMoveOut={onMoveOut}
      onUpdateProfile={handleUpdateProfile}
      onUpdatePassword={handleUpdatePassword}
      loginType={userProfile?.login_type ?? ""}
    />
  );
}
