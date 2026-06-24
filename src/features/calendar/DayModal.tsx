import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { type CSSProperties, useState } from "react";
import { AddEventForm } from "./AddEventForm.js";
import type { CalHook } from "./CalendarCore.js";
import { type CalEvent, serial } from "./calEngine.js";
import { DayModalHeader } from "./DayModalHeader.js";
import { EventRow } from "./EventRow.js";
import type { TagItem } from "./types.js";
import "./DayModal.css";

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

type DayModalProps = {
  ymd: { y: number; m: number; d: number } | null;
  cal: CalHook;
  onClose: () => void;
  onToggle: (id: string) => void;
  tags: TagItem[];
  onAddEvent: (
    kind: "todo" | "schedule",
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onFailEvent: (id: string) => Promise<void>;
  onEditEvent: (
    id: string,
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<number | null>;
  onDeleteTag: (id: number) => Promise<void>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
};

// Radix Dialog가 Esc 닫기·포커스 트랩·포커스 복귀를 담당한다. open은 ymd로 제어한다.
export function DayModal(props: DayModalProps) {
  const { ymd, onClose } = props;
  return (
    <Dialog.Root
      open={!!ymd}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {ymd && <DayModalPanel key={`${ymd.y}-${ymd.m}-${ymd.d}`} {...props} ymd={ymd} />}
    </Dialog.Root>
  );
}

type DayModalPanelProps = Omit<DayModalProps, "ymd"> & {
  ymd: { y: number; m: number; d: number };
};

function DayModalPanel({
  ymd,
  cal,
  onClose,
  onToggle,
  tags,
  onAddEvent,
  onDeleteEvent,
  onFailEvent,
  onEditEvent,
  onCreateTag,
  onDeleteTag,
  onEditTag,
}: DayModalPanelProps) {
  // 부모가 날짜(y-m-d)로 key를 주므로, 날짜가 바뀌면 이 컴포넌트가 remount되어
  // adding 초기값(추가 의도 selAdd)이 자연히 다시 잡힌다. 별도 effect 불필요.
  const { y, m, d } = ymd;

  const wd = new Date(y, m, d).getDay();
  const isPastDay = serial(y, m, d) < cal.todaySr;
  const [adding, setAdding] = useState(!isPastDay && !!cal.selAdd);
  const evs = cal.getEvents(y, m, d);
  const total = evs.length;
  const doneCount = evs.filter((e) => e.done).length;
  const isToday = cal.todaySr === serial(y, m, d);

  // 가독성을 위해 일정(schedule)과 할 일(todo)을 분리해 섹션으로 보여준다.
  const scheduleEvs = evs.filter((e) => e.scheduleId);
  const todoEvs = evs.filter((e) => !e.scheduleId);

  const renderRow = (e: CalEvent) => (
    <EventRow
      key={e.id}
      ev={e}
      isDone={e.done}
      todaySr={cal.todaySr}
      onToggle={() => onToggle(e.id)}
      onDelete={() => onDeleteEvent(e.id)}
      onFail={() => onFailEvent(e.id)}
      onEdit={(title, tagId, startStr, endStr, description) =>
        onEditEvent(e.id, title, tagId, startStr, endStr, description)
      }
      onCreateTag={onCreateTag}
      onDeleteTag={onDeleteTag}
      onEditTag={onEditTag}
      tags={tags}
    />
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="dayModalBackdrop"
        />
      </Dialog.Overlay>
      <Dialog.Content
        asChild
        aria-describedby={undefined}
        // 모달 안에서 친 키가 뒤의 게임·부모 단축키로 새지 않게 막되, Esc는 통과시켜 Radix가 닫게 한다.
        onKeyDown={(e) => {
          if (e.key !== "Escape") e.stopPropagation();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 24, stiffness: 380 }}
          className="dayModalPanel"
        >
          <Dialog.Title style={srOnly}>
            {m + 1}월 {d}일 일정
          </Dialog.Title>
          <DayModalHeader
            m={m}
            d={d}
            wd={wd}
            isToday={isToday}
            total={total}
            doneCount={doneCount}
            onClose={onClose}
          />

          <div className="calScroll dayModalScrollBody">
            {/* 추가 모드(＋)에서는 기존 목록을 숨기고 입력 폼만 보여준다. */}
            {!adding && (
              <div className="dayModalListWrap">
                {total === 0 ? (
                  <div className="dayModalEmpty">아직 등록된 일정이 없어요</div>
                ) : (
                  <div className="dayModalSections">
                    {scheduleEvs.length > 0 && (
                      <section className="dayModalSection">
                        <div className="dayModalSectionHead">
                          <span className="dayModalSectionTitle">📅 일정</span>
                          <span className="dayModalSectionCount">{scheduleEvs.length}</span>
                        </div>
                        <motion.div
                          className="dayModalList dayModalSectionScroll calScroll"
                          initial="hidden"
                          animate="show"
                          variants={staggerContainer}
                        >
                          {scheduleEvs.map(renderRow)}
                        </motion.div>
                      </section>
                    )}
                    {todoEvs.length > 0 && (
                      <section className="dayModalSection">
                        <div className="dayModalSectionHead">
                          <span className="dayModalSectionTitle">
                            <img
                              src="/assets/icon/sprout.png"
                              alt=""
                              aria-hidden="true"
                              style={{
                                width: 15,
                                height: 15,
                                objectFit: "contain",
                                flex: "0 0 auto",
                              }}
                            />
                            할 일
                          </span>
                          <span className="dayModalSectionCount">{todoEvs.length}</span>
                        </div>
                        <motion.div
                          className="dayModalList dayModalSectionScroll calScroll"
                          initial="hidden"
                          animate="show"
                          variants={staggerContainer}
                        >
                          {todoEvs.map(renderRow)}
                        </motion.div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isPastDay && (
              <div className="dayModalAddWrap">
                {!adding ? (
                  <button
                    type="button"
                    className="calBtn-dashed dayModalAddBtn"
                    onClick={() => setAdding(true)}
                  >
                    <span className="dayModalAddBtnPlus">＋</span> 할일 추가
                  </button>
                ) : (
                  <AddEventForm
                    key={`${y}-${m}-${d}`}
                    ymd={{ y, m, d }}
                    tags={tags}
                    onAddEvent={onAddEvent}
                    onCreateTag={onCreateTag}
                    onDeleteTag={onDeleteTag}
                    onEditTag={onEditTag}
                    onCancel={() => setAdding(false)}
                  />
                )}
              </div>
            )}
          </div>
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
