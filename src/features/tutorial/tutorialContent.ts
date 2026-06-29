export type TutorialCard = {
  icon: string;
  label: string;
};

// 한 필드(탭) 안의 한 페이지. 필드마다 최대 3페이지.
export type TutorialPage = {
  eyebrow?: string;
  title: string;
  illustration: string;
  summary?: string;
  bubble?: string;
  bubbleName?: string;
  paragraphs: string[];
};

export type TutorialTab = {
  id: string;
  tab: string;
  pages: TutorialPage[];
};

export const TUTORIAL_TABS: TutorialTab[] = [
  {
    id: "welcome",
    tab: "소개",
    pages: [
      {
        title: "몽글마을에 오신 걸 환영해요",
        illustration: "/assets/tutorial/mongle_profile.png",
        bubble: "반가워요!\n몽글마을에 온 걸 환영해요!",
        bubbleName: "몽글이장님",
        paragraphs: [
          "몽글마을은 나의 할 일을\n애착인형 주민들과 함께 기록하는 서비스예요.",
          "주민을 만들고, 오늘의 할 일을 적고,\n완료한 하루는 피드와 회고로 남길 수 있어요.",
          "작은 일도 괜찮아요.\n평범한 하루가 몽글한 이야기로 쌓여요.",
        ],
      },
    ],
  },
  {
    id: "village",
    tab: "마을 안내",
    pages: [
      {
        eyebrow: "메인 화면 안내",
        title: "몽글마을을 구경해요",
        illustration: "/assets/tutorial/village.png",
        paragraphs: [
          "여기가 우리 몽글마을이에요",
          "마우스 휠로 마을을 가까이 보거나 멀리서 둘러보고,",
          "빈 곳을 드래그해 보고 싶은 곳으로 이동해보세요",
          "이장님 집을 눌러 이장님과 대화하거나, 게시판을 눌러 일정을 확인해요",
        ],
      },
      {
        eyebrow: "메인 화면 안내",
        title: "상단 메뉴를 확인해요",
        illustration: "/assets/tutorial/main_btn.png",
        paragraphs: [
          "2. 알림: 아직 읽지 않은 알림을 확인해요 \n 알림을 클릭하여 읽을 수 있어요",
          "3. 핸드폰: 마을 주민들이 올린 피드를 봐요",
          "4. 일기장: 오늘의 일기를 쓰거나 지난 일기를 확인해요",
          "5. 설정: 마이페이지로 이동하거나 로그아웃할 수 있어요",
          "6. 사과 개수: 현재 보유한 사과 개수를 확인해요",
        ],
      },
      {
        eyebrow: "메인 화면 안내",
        title: "포모도로",
        illustration: "/assets/tutorial/main_pomodoro.png",
        paragraphs: [
          "집중이 필요할 땐 포모도로 타이머를 이용해봐요",
          "25분의 집중 시간과 5분의 휴식 시간을 반복하여 집중력을 유지하는 데 도움을 줘요",
          "타이머를 초기화하고 싶다면 타이머를 먼저 정지한 뒤 초기화 버튼을 눌러주세요",
        ],
      },
      {
        eyebrow: "메인 화면 안내",
        title: "오늘의 할 일",
        illustration: "/assets/tutorial/main_todo.png",
        paragraphs: [
          "오늘의 할 일 게시판에서 오늘 수행할 TODO 목록과 연결된 퀘스트를 확인해요",
          "오늘 하기 어려운 일은 포기 버튼을 눌러 포기할 수 있어요",
          "할 일을 완료했다면 체크박스를 눌러 완료한 일을 체크해요",
          "(한 번 체크하면 취소할 수 없으니 주의해주세요!)",
          "'할 일 추가' 버튼을 눌러 새로운 TODO를 추가할 수 있어요",
        ],
      },
      {
        eyebrow: "메인 화면 안내",
        title: "이장님과 대화하기",
        illustration: "/assets/tutorial/main_chat.png",
        paragraphs: [
          "이장님 집이나 이장님을 눌러 대화를 시작해요",
          "'이장님과 대화하기' 버튼으로도 대화를 시작할 수 있어요",
          "이장님과의 대화에서는 하고 싶은 것을 선택할 수 있어요",
        ],
      },
    ],
  },
  {
    id: "calendar",
    tab: "달력",
    pages: [
      {
        eyebrow: "달력",
        title: "달력에서 일정 한눈에 보기",
        illustration: "/assets/tutorial/calendar.jpeg",
        paragraphs: [
          "날짜별 할 일과 일정을 캘린더에서 한눈에 볼 수 있어요.",
          "태그 색상으로 표시되어 어떤 일인지 쉽게 구분할 수 있어요.",
          "날짜를 누르면 오른쪽 카드에서 그날의 할 일을 바로 확인할 수 있어요.",
          "완료한 할 일은 회색과 취소선으로 정리돼요.",
        ],
      },
      {
        eyebrow: "달력",
        title: "할 일과 일정 등록하기",
        illustration: "/assets/tutorial/calendar_2.png",
        paragraphs: [
          "날짜를 선택한 뒤 + 버튼을 누르면 새 할 일이나 일정을 등록할 수 있어요.",
          "할 일은 하루에 끝내는 한 가지 일이에요.",
          "일정은 시작일과 종료일이 있는 계획이에요.",
          "태그를 선택하면 더 보기 쉽게 정리할 수 있어요",
          "지난 날짜에는 새 할 일이나 일정을 등록할 수 없어요.",
        ],
      },
      {
        eyebrow: "달력",
        title: "완료하고 정리하기",
        illustration: "/assets/tutorial/calendar_detail.png",
        paragraphs: [
          "선택한 날짜를 다시 누르면 자세한 관리 창이 열려요.",
          "할 일은 하루짜리 일, 일정은 기간이 있는 계획이에요.",
          "할 일을 완료하면 사과 1개를 받을 수 있고, 완료는 되돌릴 수 없어요.",
          "오늘 할 일은 포기할 수 있고, 일정은 수정하거나 삭제할 수 있어요.",
        ],
      },
    ],
  },
  {
    id: "character",
    tab: "캐릭터 생성",
    pages: [
      {
        eyebrow: "캐릭터 생성",
        title: "몽글마을 주민 입주 안내서",
        illustration: "/assets/tutorial/char_type.png",
        paragraphs: [
          "애착인형의 사진을 올려 내 애착인형과 닮은 주민을 만들거나,",
          "사진 없이 입력 정보만으로 새로운 주민을 만들 수 있어요",
          "이미지 업로드 방식을 선택했다면 오른쪽 네모 박스 안에 애착인형의 사진을 올려주세요",
          "텍스트로 생성 방식을 선택했다면 바로 다음 단계로 넘어가면 돼요",
          "Tip! 사진은 밝고 단순한 배경에서 찍으면 실물과 더 닮은 캐릭터로 생성돼요",
        ],
      },
      {
        eyebrow: "캐릭터 생성",
        title: "주민 프로필 정보 입력",
        illustration: "/assets/tutorial/char_text.png",
        paragraphs: [
          "내 애착인형의 정보나, 애착인형이 아직 없다면 상상해서 적으면 돼요",
          "캐릭터 이름은 몽글마을 안에서 주민을 부를 때 사용돼요.",
          "주민의 기본 성격을 정할 수 있어요\n최대 3개까지 선택할 수 있어요",
          "캐릭터 설명에는 주민의 성격과 외형 특징을 자유롭게 적으면 돼요.",
          "Tip! 구체적으로 적으면 더 원하는 모습에 가까운 주민을 만들 수 있어요.",
        ],
      },
      {
        eyebrow: "캐릭터 생성",
        title: "캐릭터 생성",
        illustration: "/assets/tutorial/char_create.png",
        paragraphs: [
          "정보를 모두 입력했다면 캐릭터 생성하기 버튼을 눌러주세요.",
          "주민이 만들어지기까지 시간이 조금 걸릴 수 있어요.",
          "마음에 들지 않으면 정보를 수정해 다시 생성할 수 있어요.",
          "생성은 하루 최대 3회까지 가능하고, 밤 12시에 다시 채워져요.",
          "마음에 드는 주민이 완성되면 입주를 확정해주세요.",
        ],
      },
    ],
  },
  {
    id: "todo",
    tab: "일정 관리",
    pages: [
      {
        eyebrow: "오늘의 TODO",
        title: "오늘의 할 일을 적어봐요",
        illustration: "/assets/tutorial/todo_create.png",
        paragraphs: [
          "오늘 해야 할 일을 이장님에게 말하거나 직접 적을 수 있어요.",
          "여러 할 일을 한 문장으로 적어도 이장님이 TODO로 나눠 정리해줘요.",
          "직접 적기는 짧은 할 일을 빠르게 추가할 때 좋아요.",
          "태그를 선택하면 할 일을 종류별로 쉽게 구분할 수 있어요.",
        ],
      },
      {
        eyebrow: "오늘의 TODO",
        title: "오늘의 할 일을 등록해요",
        illustration: "/assets/tutorial/todo_quest.png",
        paragraphs: [
          "정리된 TODO를 확인한 뒤 오늘의 할 일에 등록할 수 있어요.",
          "원하는 TODO에는 태그를 적용하거나 퀘스트를 연결할 수 있어요.",
          "퀘스트를 연결하면 주민이 랜덤으로 배정되고, 작은 미션이 함께 생겨요.",
          "캐릭터 퀘스트는 하루 최대 5개까지 만들 수 있어요.",
          "TODO를 완료하면 사과 1개를 받을 수 있고, 하루 최대 10개까지 모을 수 있어요.",
        ],
      },
    ],
  },
  {
    id: "planner",
    tab: "플래너 챗봇",
    pages: [
      {
        eyebrow: "플래너 챗봇",
        title: "이장님과 계획을 세워요",
        illustration: "/assets/tutorial/planner_chat.png",
        paragraphs: [
          "무엇부터 해야 할지 막막할 때 이장님과 대화해보세요.",
          "목표를 말하면 이장님이 기간, 우선순위, 반복 여부를 물어보며 계획을 정리해줘요.",
          "대화로 큰 목표를 작은 할 일로 나눌 수 있어요.",
          "대화 중 화면을 나가면 내용이 저장되지 않으니 주의해주세요!.",
        ],
      },
      {
        eyebrow: "플래너 챗봇",
        title: "계획을 저장해요",
        illustration: "/assets/tutorial/planner_save.png",
        paragraphs: [
          "이장님이 정리한 계획은 생성된 플랜에 모여 보여요.",
          "내용을 확인한 뒤 계획 저장 버튼을 누르면 할 일로 저장할 수 있어요.",
          "저장된 계획은 오늘의 할 일과 캘린더에서 확인할 수 있어요.",
          "저장하기 전에는 대화 내용이 남지 않으니 필요한 계획은 꼭 저장해주세요.",
        ],
      },
    ],
  },
  {
    id: "feed",
    tab: "피드 생성",
    pages: [
      {
        eyebrow: "피드",
        title: "주민들의 소식을 확인해요",
        illustration: "/assets/tutorial/feed_list.png",
        paragraphs: [
          "주민이 퀘스트를 완료하면 새로운 피드가 올라와요.",
          "피드가 올라오면 알림으로 알려드려요.",
          "알림을 누르거나 핸드폰 아이콘을 누르면 주민들의 피드를 볼 수 있어요.",
          "피드에는 주민의 성격과 완료한 퀘스트 내용이 함께 담겨요.",
        ],
      },
      {
        eyebrow: "피드",
        title: "주민들과 소통해요",
        illustration: "/assets/tutorial/feed_comment.png",
        paragraphs: [
          "게시물을 눌러 자세히 보고 좋아요를 누를 수 있어요.",
          "댓글을 달면 사과 3개가 사용돼요.",
          "댓글을 남기면 주민이 잠시 뒤 답글을 남겨줘요.",
          "주민 프로필을 누르면 그동안 올린 피드를 모아볼 수 있어요.",
          "내 마을의 피드는 친구에게 공유할 수 있어요.",
        ],
      },
    ],
  },
  {
    id: "reflection",
    tab: "회고록",
    pages: [
      {
        eyebrow: "회고록",
        title: "오늘의 회고를 작성해요",
        illustration: "/assets/tutorial/reflection_today.png",
        paragraphs: [
          "오늘의 할 일을 보며 잘한 점과 아쉬운 점을 적어보세요.",
          "둘 중 하나만 작성해도 괜찮아요.",
          "30자 이상 작성한 항목마다 사과 2개를 받을 수 있어요.",
          "작성한 회고를 나중에 수정하려면 사과 15개가 필요하니 저장 전 확인 필수!",
          "오늘의 회고를 수정하다가 보상 조건을 채워도 사과를 받을 수 있어요",
        ],
      },
      {
        eyebrow: "회고록",
        title: "지난 회고를 확인해요",
        illustration: "/assets/tutorial/reflection_before.png",
        paragraphs: [
          "왼쪽 아래 화살표 버튼으로 지난 날의 회고를 다시 볼 수 있어요.",
          "작성한 회고가 있는 날만 확인할 수 있어요.",
          "지난 회고도 사과 15개를 소모하여 수정할 수 있지만 추가 사과는 받을 수 없어요.",
        ],
      },
    ],
  },
];
