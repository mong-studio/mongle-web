import { useEffect, useState } from "react";

// 좁은 화면(폰)에서 월 그리드 셀이 1fr로 눌리면 고정 px 일정이 넘쳐 잘린다.
// 같은 760px 기준으로 셀 내부 크기를 함께 줄여 일정이 칸 안에 맞게 한다.
export function useIsNarrow(query = "(max-width: 760px)"): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setNarrow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}
