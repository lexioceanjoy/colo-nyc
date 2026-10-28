// Long-form About copy (SPEC §6.7). zh is written for 小红书 readers, not translated line by line.
// Numbers in {braces} are filled from the data at build time (src/lib/stats.ts).

type Section = { title: string; body: string[] };
type Step = { when: string; what: string };

export type AboutCopy = {
  title: string;
  lede: string;
  stats: { spots: string; sources: string; known: string; agents: string };
  sections: Section[];
  rubricTitle: string;
  rubric: { level: "high" | "medium" | "low"; text: string }[];
  timelineTitle: string;
  timeline: Step[];
  excludedTitle: string;
  excludedIntro: string;
  excludedKinds: Record<"closed" | "laptops" | "paid" | "other", string>;
  creditsTitle: string;
  credits: string[];
  desk: string;
};

export const AGENT_COUNT = 24; // 4 candidate + 13 research + 7 gap-fill subagents (BUILD_LOG.md)

export const about: Record<"en" | "zh", AboutCopy> = {
  en: {
    title: "How this was built",
    lede: "Someone in the Next Play Slack asked where people in NYC go to cowork and colocate. The answers were static cafe lists with stale, unexplained data. This is an attempt at a better answer, built in one day by one person working with AI agents, and honest about what it doesn't know.",
    stats: { spots: "spots", sources: "sources cited", known: "of details known", agents: "AI research agents" },
    sections: [
      {
        title: "The method",
        body: [
          "Claude Code ran parallel research agents. Four of them collected about 200 candidates from guides, newsletters, library systems, NYC's privately owned public space records and hotel sites. Thirteen more researched about ten spots each. They read each venue's own site for hours and laptop rules, then cross-checked work details like Wi-Fi, outlets, noise, time limits and group seating.",
          "Every detail carries the URLs it came from, a confidence level and the date it was checked. When agents couldn't find something, they wrote \"unknown\" instead of guessing. That's why many spots have gaps: an empty box is better than a confident wrong one.",
          "Google is used only to confirm each place exists, put it on the map and catch closures. Everything you read about a spot, hours included, is our own research.",
        ],
      },
      {
        title: "The Work Score",
        body: [
          "A 0–10 score: Wi-Fi 25%, outlets 20%, seating 15%, noise 15%, laptop policy 15%, time limit 10%. Unknown details count as half credit and pull the confidence down. That's why some circles are dashed or dotted. Tap any score to see the math.",
        ],
      },
      {
        title: "Why a social layer",
        body: [
          "Finding a good table is half the problem. The other half is that working alone gets lonely. Check in when you're somewhere (\"I'm here today\") or host a cowork session, and other people can join you. Anonymous visitors only ever see counts, never names.",
        ],
      },
    ],
    rubricTitle: "What the confidence levels mean",
    rubric: [
      { level: "high", text: "Two or more independent recent sources agree, or it's the venue's official policy." },
      { level: "medium", text: "One credible recent source." },
      { level: "low", text: "Older or conflicting sources. The note explains the conflict." },
    ],
    timelineTitle: "The build, in one day",
    timeline: [
      { when: "Hour 0", what: "Spec, market scan, and four candidate-collection agents started in parallel with the app scaffold." },
      { when: "Hour 0.3", what: "202 candidates in. 45 excluded with reasons (closures, laptop bans). Curated to 132." },
      { when: "Hour 0.5", what: "13 research agents, about 10 spots each. The shared web-search budget ran out mid-run, so agents switched to reading sites directly and left gaps instead of guessing." },
      { when: "Hour 1", what: "Gap-fill passes, place IDs resolved, coordinates fetched. Google's closure check hid 4 more spots that had closed." },
      { when: "Hour 1.5", what: "The map: screenshot reviews caught a render loop and a hidden duplicate map before anyone saw them." },
      { when: "Day 2", what: "The social layer: Google sign-in, \"I'm here today\" check-ins, cowork sessions with invite cards, reports and moderation. All of it was tested end to end against a separate test database, never the real one." },
      { when: "Day 2", what: "A second data pass: politely re-reading venue sites, importing OpenStreetMap, and hiding any spot with fewer than 3 of the 5 core details instead of padding it. Now people who work there can fill the gaps: two matching answers confirm a detail." },
    ],
    excludedTitle: "What we left out, and why",
    excludedIntro: "Part of being useful is saying no. These came up in research but didn't make the map:",
    excludedKinds: { closed: "Closed or moved", laptops: "Laptops not welcome", paid: "Paid coworking (out of scope)", other: "Not workable" },
    creditsTitle: "Credits",
    credits: [
      "The question came from the Next Play community.",
      "Sources include Half Half Travel, WFHishNYC, The Infatuation, Time Out, NYU News, West Side Rag, Brooklyn Magazine, the NYPL / BPL / QPL library systems, APOPS (NYC privately owned public spaces) and NYC Planning Labs GeoSearch.",
      "Some opening hours and Wi-Fi details come from OpenStreetMap: © OpenStreetMap contributors, available under the Open Database License (ODbL 1.0). Those details link to their OSM source.",
      "Built with Claude Code, Next.js, Supabase and Google Maps Platform.",
    ],
    desk: "Need a real desk for the day? Croissant and Deskpass sell day passes. We don't list paid coworking here.",
  },
  zh: {
    title: "这个网站是怎么做出来的",
    lede: "Next Play 社群里有人问：在纽约，大家都去哪儿 co-work、约人一起办公？网上能搜到的大多是不怎么更新的咖啡馆清单，信息哪来的也不说。所以干脆自己做一个：一个人加一群 AI 助手，一天之内搭出来，而且不知道的就老实写「不知道」。",
    stats: { spots: "个地点", sources: "条信息来源", known: "的信息已查到", agents: "个 AI 调研助手" },
    sections: [
      {
        title: "怎么调研的",
        body: [
          "用 Claude Code 同时开了好几个 AI 调研助手：先有 4 个从攻略、newsletter、图书馆官网、纽约公共空间（POPS）记录和酒店官网里扒出约 200 个候选地点；再由 13 个助手每人负责十来个地点，去店家官网查营业时间和能不能开电脑，再交叉核对网速、插座、吵不吵、限不限时、能不能多人坐。",
          "每一条信息都附上来源链接、可信度和核对日期。查不到就写「暂不清楚」，绝不瞎猜。所以有些地点的信息会空着，空着总比自信地写错强。",
          "Google 只用来确认地点真实存在、在地图上标位置、以及发现倒闭的店。你看到的其他所有信息（包括营业时间）都是我们自己调研的。",
        ],
      },
      {
        title: "办公评分怎么算",
        body: [
          "满分 10 分：Wi-Fi 占 25%，插座 20%，座位 15%，安静度 15%，能否开电脑 15%，限时 10%。不确定的项按一半分算，同时拉低可信度，所以有的分数圈是虚线。点开任何一个分数都能看到明细。",
        ],
      },
      {
        title: "为什么要做「打卡」和「组局」",
        body: [
          "找到好位置只解决了一半问题，另一半是一个人办公太孤单。到了就点「我今天在这儿」，或者发起一场 co-work 组局，附近的人就能来一起。没登录的人只能看到人数，看不到名字。",
        ],
      },
    ],
    rubricTitle: "可信度是什么意思",
    rubric: [
      { level: "high", text: "2 个以上近期独立来源说法一致，或者是店家官方规定。" },
      { level: "medium", text: "1 个可信的近期来源。" },
      { level: "low", text: "来源比较旧，或者说法不一（备注里会写清楚哪里有出入）。" },
    ],
    timelineTitle: "一天之内的搭建过程",
    timeline: [
      { when: "第 0 小时", what: "写好需求和竞品调研，4 个 AI 助手开始收集候选地点，同时搭网站框架。" },
      { when: "约 20 分钟", what: "收集到 202 个候选，45 个因倒闭或禁止开电脑被排除，精选出 132 个。" },
      { when: "约 30 分钟", what: "13 个调研助手同时开工。中途搜索额度用完，助手们改成直接读网页，查不到的宁可空着也不瞎猜。" },
      { when: "约 1 小时", what: "补漏调研、对接 Google 地点 ID 和坐标；Google 的倒闭检测又筛掉了 4 家已经关门的店。" },
      { when: "约 1.5 小时", what: "上地图。截图自查时抓到了两个 bug（无限渲染、隐藏的重复地图），上线前就修好了。" },
      { when: "第 2 天", what: "上线社交功能：Google 登录、「我今天在这儿」打卡、带邀请卡片的组局、举报和管理后台。全部在独立的测试数据库里做了端到端测试，没碰正式数据。" },
      { when: "第 2 天", what: "第二轮数据补全：礼貌地重新读取店家官网、导入 OpenStreetMap，5 项核心信息不足 3 项的地点先隐藏，不凑数。现在在这儿办公的人也能帮忙补：两个人说法一致就算确认。" },
    ],
    excludedTitle: "哪些地方没收录，为什么",
    excludedIntro: "有用的清单也要敢说「不推荐」。下面这些在调研中出现过，但没放进地图：",
    excludedKinds: { closed: "已关门或搬走", laptops: "不欢迎开电脑", paid: "付费共享办公（不在收录范围）", other: "不适合办公" },
    creditsTitle: "致谢",
    credits: [
      "这个问题来自 Next Play 社群。",
      "信息来源包括 Half Half Travel、WFHishNYC、The Infatuation、Time Out、NYU News、West Side Rag、Brooklyn Magazine、纽约三大公共图书馆系统（NYPL / BPL / QPL）、APOPS（纽约私有公共空间）和 NYC Planning Labs GeoSearch。",
      "部分营业时间和 Wi-Fi 信息来自 OpenStreetMap：© OpenStreetMap 贡献者，依据开放数据库许可协议（ODbL 1.0）提供。这些信息都附有 OSM 原始链接。",
      "用 Claude Code、Next.js、Supabase 和 Google Maps Platform 搭建。",
    ],
    desk: "需要正经工位？Croissant 和 Deskpass 可以买日卡。付费共享办公空间不在本站收录范围。",
  },
};
