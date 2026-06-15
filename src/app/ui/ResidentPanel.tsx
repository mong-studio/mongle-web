import type { Resident } from "../model/appTypes.js";

type ResidentPanelProps = {
  residents: Resident[];
  onAddResident: () => void;
};

export function ResidentPanel({ residents, onAddResident }: ResidentPanelProps) {
  return (
    <div className="leftRail">
      <aside className="residentPanel" aria-label="마을 주민">
        <div className="residentPanelHeader">
          <img src="/assets/hud/flower3.png" alt="" />
          <h2>주민 목록</h2>
          <img src="/assets/hud/flower3.png" alt="" />
          <span>{residents.length} / 10</span>
        </div>
        <ul className="residentCards">
          {residents.slice(0, 8).map((resident) => (
            <li key={resident.id}>
              <img
                className="residentAvatar"
                src={resident.avatarUrl || "/assets/character/mp-avatar-sm.png"}
                alt=""
              />
              <b>{resident.name}</b>
              <img className="residentDecor" src="/assets/hud/plant.png" alt="" />
            </li>
          ))}
        </ul>
        <button type="button" className="residentAddCard" onClick={onAddResident}>
          <img src="/assets/hud/add-character.png" alt="" />
          <span>새로운 주민을 기다리고 있어요!</span>
          <img src="/assets/hud/plant.png" alt="" />
        </button>
      </aside>
    </div>
  );
}
