import { useEffect, useState } from "react";
import { apiClient } from "../../shared/api/client.js";
import { useAuthStore } from "../auth/store.js";
import { MyPageModal, type Resident } from "./MyPage.js";

type UserProfile = {
  user_name: string;
  job: string;
  birth: string | null;
  token_balance: number;
  created_at?: string;
};

type Props = {
  residents: Resident[];
  onClose: () => void;
  onNotice: (msg: string) => void;
};

export function MyPageWrapper({ residents, onClose, onNotice }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const logoutSession = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  useEffect(() => {
    apiClient
      .get<UserProfile>("/auth/me/")
      .then((res) => setUserProfile(res.data))
      .catch(() => onNotice("프로필 정보를 불러오지 못했어요."));
  }, [onNotice]);

  async function handleWithdraw() {
    try {
      await apiClient.delete("/auth/me/");
      await logoutSession();
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

  async function handleUpdatePassword(current: string, next: string, confirm: string) {
    if (next !== confirm) {
      onNotice("새 비밀번호가 일치하지 않아요.");
      return;
    }
    try {
      await apiClient.post("/auth/change-password/", {
        current_password: current,
        new_password: next,
      });
      onNotice("비밀번호가 변경됐어요.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "비밀번호 변경에 실패했어요.");
    }
  }

  return (
    <MyPageModal
      userName={userProfile?.user_name ?? authUser?.userName ?? "몽글러"}
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
