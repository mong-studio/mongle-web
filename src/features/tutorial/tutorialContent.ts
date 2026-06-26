export type TutorialCard = {
  icon: string;
  label: string;
};

// 한 필드(탭) 안의 한 페이지. 필드마다 최대 3페이지.
export type TutorialPage = {
  title: string;
  illustration: string;
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
    tab: "환영",
    pages: [
      {
        title: "몽글마을에 오신 걸 환영해요",
        illustration: "/assets/mongle_chief.png",
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
    id: "character",
    tab: "캐릭터 생성",
    pages: [
      {
        title: "몽글마을 주민 입주 안내서",
        illustration: "/assets/tutorial/char_img.png",
        paragraphs: [
          "몽글마을에서는 나만의 애착인형 주민을 만들 수 있어요.\n사진을 올려 주민의 원본 이미지를 함께 등록할 수도 있고, 사진 없이 이름과 성격, 설명만으로도 새로운 주민을 만들 수 있어요.",
          "주민은 이미지 업로드 방식과 텍스트 자동 생성 방식 중 하나를 선택해 만들 수 있어요.\n이미지 업로드 방식은 가지고 있는 애착인형 사진을 함께 등록하는 방식이에요.\n사진은 선택사항이므로, 올리지 않아도 캐릭터 생성은 진행할 수 있어요.",
          "텍스트 자동 생성 방식은 캐릭터 이름, 성격 키워드, 설명을 입력해 주민을 만드는 방식이에요.\n입력한 내용을 바탕으로 주민 캐릭터가 생성돼요.",
        ],
      },
      {
        title: "텍스트로 캐릭터 생성",
        illustration: "/assets/tutorial/char_text.png",
        paragraphs: [
          "사진을 올리지 않아도 캐릭터 이름, 성격 키워드, 설명만으로 주민을 만들 수 있어요.",
          "캐릭터 이름은 몽글마을 안에서 주민을 부를 때 사용돼요.\n주민에게 잘 어울리는 이름을 지어주세요.",
          "성격 키워드는 주민의 기본 성격을 정하는 요소예요.\n최대 3개까지 선택할 수 있으며, 선택한 성격은 주민의 말투, 퀘스트, 알림, 피드 글에 반영돼요.",
          "캐릭터 설명에는 주민의 성격과 외형 특징을 자유롭게 적을 수 있어요.\n좋아하는 것, 말투, 습관, 분위기뿐만 아니라 원하는 외형도 함께 적어주세요.\n어떤 인형인지, 전체 모양, 주요 색깔, 무늬, 얼굴 특징, 귀·팔·다리·꼬리, 옷차림, 소품 등을 구체적으로 적으면 더 원하는 모습에 가까운 주민을 만들 수 있어요.",
          "예시)\n“하얀색 네모난 토끼 인형이고, 핑크색 리본이 꼭 있었으면 좋겠어요.\n조용하지만 다정한 성격이고, 말투는 부드러웠으면 좋겠어요.”",
        ],
      },
      {
        title: "캐릭터 생성",
        illustration: "/assets/tutorial/char_create.png",
        paragraphs: [
          "입력한 정보를 바탕으로 주민 캐릭터가 생성돼요.\n생성된 캐릭터는 미리보기 화면에서 확인할 수 있어요.\n생성된 캐릭터가 마음에 들면 입주를 확정할 수 있어요.\n입주가 완료되면 해당 캐릭터는 나만의 주민으로 몽글마을에 나타나요.",
          "캐릭터가 마음에 들지 않는다면 다시 생성할 수 있어요.\n다시 생성할 때는 이전에 입력했던 이름, 성격 키워드, 설명이 유지돼요.\n필요하다면 내용을 수정한 뒤 다시 생성할 수도 있어요.\n이미지 재생성은 계정당 하루 3회까지 가능해요.\n재생성 횟수는 매일 밤 12시에 다시 채워져요.\n마을의 주민은 총 10명까지 입주 가능해요.",
          "나만의 애착인형 주민을 만들고, 몽글마을에서 함께 하루를 보내보세요.",
        ],
      },
    ],
  },
  {
    id: "todo",
    tab: "일정 관리",
    pages: [
      {
        title: "오늘의 할 일을 적어봐요",
        illustration: "/assets/tutorial/todo_input.png",
        paragraphs: [
          "오늘 해야 할 일을 적거나, 이장님에게 편하게 말해보세요. 여러 할 일을 한 문장으로 입력해도 괜찮아요.",
          "이장님이 내용을 살펴보고 TODO 목록으로 나누어 정리해줘요. 원한다면 TODO를 직접 추가할 수도 있어요.",
          "생성된 TODO는 바로 확정하지 않아도 괜찮아요. 내용을 확인하고, 필요한 부분은 수정한 뒤 확정할 수 있어요.",
        ],
      },
      {
        title: "애착인형에게 퀘스트를 부여해요.",
        illustration: "/assets/tutorial/todo_quest.png",
        paragraphs: [
          "확정하기 전, 원하는 TODO를 골라 애착인형의 퀘스트로 연결할 수 있어요. 함께 진행할 애착인형을 선택하면, 그 주민에게 어울리는 작은 미션이 부여돼요.",
          "TODO와 퀘스트가 연결되면 내 애착인형이 하루의 할 일을 함께 수행해요. TODO를 완료하면 연결된 애착인형의 퀘스트도 함께 완료돼요.",
          "TODO 하나를 완료할 때마다 사과 1개를 받을 수 있고, 하루에 최대 10개까지 모을 수 있어요.\n\n",
          "* 애착인형 퀘스트는 하루 최대 5개까지 가능해요.",
        ],
      },
      {
        title: "긴 계획도 이장님과 함께 만들어요.",
        illustration: "/assets/dialogue/dialogue_todo.png",
        paragraphs: [
          "할 일을 끝내고 체크하면\n사과 보상이 쌓여요.",
          "모인 사과로 마을을 가꾸고\n주민들과 더 가까워져요.",
        ],
      },
    ],
  },
  {
    id: "planner",
    tab: "플래너 챗봇",
    pages: [
      {
        title: "플래너 챗봇과 계획을 짜요",
        illustration: "/assets/dialogue/dialogue_chat.png",
        paragraphs: [
          "무엇부터 할지 막막할 땐\n이장님과 대화하며 정리해요.",
          "챗봇이 질문을 던지며\n흐릿한 목표를 또렷한 일정으로 만들어요.",
          "완성된 계획은 태그와 함께\n할 일로 바로 저장할 수 있어요.",
        ],
      },
      {
        title: "대화로 목표를 좁혀요",
        illustration: "/assets/dialogue/dialogue_chat.png",
        paragraphs: [
          "막연한 목표도 챗봇과\n주고받다 보면 또렷해져요.",
          "큰 일은 작은 단계로\n잘게 쪼개 정리해줘요.",
        ],
      },
      {
        title: "계획을 바로 저장해요",
        illustration: "/assets/dialogue/dialogue_chat.png",
        paragraphs: [
          "정리된 계획은 태그와 함께\n할 일 목록으로 옮겨져요.",
          "고민하던 하루가 곧장\n실행 가능한 일정이 돼요.",
        ],
      },
    ],
  },
  {
    id: "feed",
    tab: "피드 생성",
    pages: [
      {
        title: "하루를 피드로 남겨요",
        illustration: "/assets/dialogue/dialogue_mongle.png",
        paragraphs: [
          "완료한 할 일과 하루의 순간을\n피드로 기록할 수 있어요.",
          "주민들이 내 피드에 반응하고\n함께 하루를 응원해줘요.",
          "차곡차곡 쌓인 피드가\n나만의 몽글 일상이 돼요.",
        ],
      },
      {
        title: "주민들이 반응해요",
        illustration: "/assets/dialogue/dialogue_mongle.png",
        paragraphs: [
          "올린 피드에 주민들이\n댓글과 응원을 남겨요.",
          "혼자가 아니라 함께\n하루를 돌아보는 기분이에요.",
        ],
      },
      {
        title: "일상이 쌓여가요",
        illustration: "/assets/dialogue/dialogue_mongle.png",
        paragraphs: [
          "차곡차곡 모인 피드가\n나만의 몽글 앨범이 돼요.",
          "지난 하루를 넘겨보며\n작은 성장을 발견해요.",
        ],
      },
    ],
  },
  {
    id: "reflection",
    tab: "회고록",
    pages: [
      {
        title: "하루를 돌아보며 회고해요",
        illustration: "/assets/reflection/reflection-diary.png",
        paragraphs: [
          "하루가 끝나면 오늘을 돌아보며\n짧은 회고를 적어요.",
          "이장님이 하루를 정리해주고\n따뜻한 한마디를 건네요.",
          "회고를 남기면 사과를 받고\n마을에서의 하루가 마무리돼요.",
        ],
      },
      {
        title: "이장님과 하루를 정리해요",
        illustration: "/assets/reflection/reflection-diary.png",
        paragraphs: [
          "오늘 있었던 일을 적으면\n이장님이 차분히 정리해줘요.",
          "잘한 점과 아쉬운 점을\n따뜻하게 짚어줘요.",
        ],
      },
      {
        title: "회고로 하루를 마무리해요",
        illustration: "/assets/reflection/reflection-diary.png",
        paragraphs: [
          "회고를 남기면 사과를 받고\n오늘 하루가 마무리돼요.",
          "매일의 회고가 모여\n나를 더 잘 알게 돼요.",
        ],
      },
    ],
  },
];
