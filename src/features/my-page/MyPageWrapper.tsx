import { useEffect, useState } from "react";
import { apiClient } from "../../shared/api/client.js";
import { MyPageModal, type Resident } from "./MyPage.js";

type UserProfile = {
  user_name: string;
  job: string;
  birth: string | null;
  token_balance: number;
  created_at?: string;
};

type Props = {
  fallbackUserName: string;
  residents: Resident[];
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  onNotice: (msg: string) => void;
};

export function MyPageWrapper({ fallbackUserName, residents, onClose, onLogout, onNotice }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    apiClient
      .get<UserProfile>("/auth/me/")
      .then((res) => setUserProfile(res.data))
      .catch(() => onNotice("프로필 정보를 불러오지 못했어요."));
  }, [onNotice]);

  async function handleWithdraw() {
    try {
      await apiClient.delete("/auth/me/");
      await onLogout();
      onClose();
      onNotice("계정이 탈퇴됐어요.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "탈퇴에 실패했어요.");
    }
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

  async function handleUpdatePassword(current: string, next: string) {
    await apiClient.post("/auth/change-password/", {
      current_password: current,
      new_password: next,
    });
  }

  return (
    <MyPageModal
      userName={userProfile?.user_name ?? fallbackUserName}
      userJob={userProfile?.job ?? ""}
      userBirth={userProfile?.birth ?? ""}
      tokenBalance={userProfile?.token_balance ?? 0}
      joinDate={userProfile?.created_at ?? ""}
      residents={residents}
      onClose={onClose}
      onWithdraw={handleWithdraw}
      onUpdateProfile={handleUpdateProfile}
      onUpdatePassword={handleUpdatePassword}
    />
  );
}
