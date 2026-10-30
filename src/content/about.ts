// About copy (SPEC §6.7): five short lines per language. zh is written for 小红书 readers, not translated line by line.

export type AboutCopy = {
  title: string;
  what: string;
  how: string;
  suggest: string;
  credits: { osm: string; google: string; license: string };
  privacy: string;
};

export const about: Record<"en" | "zh", AboutCopy> = {
  en: {
    title: "About",
    what: "Colo NYC is a map of the best places in NYC to work, and to work together.",
    how: "AI agents researched every spot from public sources, and visitors fill in and correct the details.",
    suggest: "Suggest a spot",
    credits: { osm: "© OpenStreetMap contributors (ODbL)", google: "Map © Google", license: "Spot data licensed under ODbL" },
    privacy: "Privacy",
  },
  zh: {
    title: "关于",
    what: "Colo NYC 是一张纽约办公地图：哪里适合带电脑干活，哪里适合约人一起办公。",
    how: "每个地点先由 AI 根据公开资料调研，再由去过的人补充和纠错。",
    suggest: "推荐地点",
    credits: { osm: "© OpenStreetMap 贡献者（ODbL）", google: "地图 © Google", license: "地点数据依据 ODbL 授权" },
    privacy: "隐私",
  },
};
