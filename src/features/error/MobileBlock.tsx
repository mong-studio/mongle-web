import "./mobileBlock.css";

// 앱 base 경로 기준으로 자산을 해석한다(서브패스 배포 대비). NotFound 와 동일.
const ASSET_BASE = `${import.meta.env.BASE_URL}assets/error`;

/**
 * 모바일/태블릿 접속 안내 화면. 몽글마을은 넓은 화면 기준의 데스크톱 픽셀 게임이라,
 * 모바일/태블릿에서는 앱 대신 이 안내를 보여준다(MobileGate 가 렌더).
 */
export function MobileBlock() {
  const host = typeof window !== "undefined" ? window.location.host : "";
  return (
    <div className="mb-root">
      <main className="mb-stage" aria-labelledby="mb-title">
        <img className="mb-house" src={`${ASSET_BASE}/house.png`} alt="마을 집" />
        <h1 id="mb-title" className="mb-title">
          몽글마을은 PC에서 만나요
        </h1>
        <p className="mb-sub">
          몽글마을은 넓은 마당에 지어진 마을이라
          <br />
          데스크톱(PC)에서 가장 포근하게 즐길 수 있어요.
        </p>
        <div className="mb-card">
          <span className="mb-card-label">PC 브라우저로 접속해주세요</span>
          {host && <span className="mb-card-url">{host}</span>}
        </div>
        <p className="mb-note">작은 화면에는 마을이 다 담기지 않아 잠시 문을 닫아두었어요. 🏡</p>
      </main>
    </div>
  );
}
