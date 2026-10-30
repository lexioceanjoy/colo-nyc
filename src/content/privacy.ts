// Privacy page copy (SPEC §7). Plain language; zh written for native readers, not translated line by line.
// Keep in sync with supabase/migrations (what is stored) and the pg_cron cleanup job (how long).

type Section = { title: string; items: string[] };

export type PrivacyCopy = {
  title: string;
  updated: string;
  lede: string;
  sections: Section[];
  contactTitle: string;
  contact: string;
};

export const PRIVACY_UPDATED = "2026-10-30";

export const privacy: Record<"en" | "zh", PrivacyCopy> = {
  en: {
    title: "Privacy",
    updated: "Last updated: ",
    lede: "You can browse the map, spots and sessions without an account. Signing in is only needed to check in, host or join a session, or report something. Here's exactly what we keep.",
    sections: [
      {
        title: "What we store",
        items: [
          "Your Google account name and email address, which Google shares when you sign in with Google. We use them only to run your account, and we never show your email to other people.",
          "Your profile: the display name you choose (a first name is fine), an optional short headline, an optional https link, an optional \"I'm in Next Play\" tag, and your language.",
          "Check-ins: which spot, the date, a rough time window (morning, afternoon, evening or all day), what you're open to, and an optional note. They disappear from the site at midnight New York time and are deleted for good after 7 days.",
          "Sessions you host and sessions you RSVP to, until you delete them or your account.",
          "Reports you file, and spot suggestions or corrections you send. Suggestions can be sent without an account. To stop spam we keep a one-way hash of your IP address for at most 2 days, never the IP itself.",
        ],
      },
      {
        title: "Who can see it",
        items: [
          "Visitors who aren't signed in see only counts, like \"3 people here today\". Never names.",
          "Signed-in users can see the display name, headline and link of people who are checked in or going to a session. Anyone who signs in can see who's checked in, so share only what you're comfortable with.",
          "Hosts see who RSVP'd to their session.",
          "The site admin sees reports, suggestions and corrections in order to moderate them. Anything reported by 2 different people is hidden automatically.",
        ],
      },
      {
        title: "What we don't do",
        items: [
          "No ads, no selling data, no sharing with anyone except the services that run the site: Supabase (database and sign-in), Vercel (hosting) and Google (sign-in and the map).",
          "Analytics are Vercel Web Analytics: cookieless, aggregate page views only, nothing that identifies you.",
          "The map is Google Maps, loaded from Google, so Google's privacy policy applies to it.",
          "\"Near me\" uses your location only in your browser, only after you tap the button. It is never sent to us, Supabase or analytics, never put in a link, and never saved.",
        ],
      },
      {
        title: "Deleting your account",
        items: [
          "Use \"Delete my account\" in your profile. It removes your account and everything linked to it (profile, check-ins, sessions, RSVPs and reports) right away.",
          "You can also email us and we'll do it for you.",
          "To also remove the site's access from your Google account, go to myaccount.google.com → Security → Third-party apps & services.",
        ],
      },
    ],
    contactTitle: "Contact",
    contact: "Questions or deletion requests:",
  },
  zh: {
    title: "隐私说明",
    updated: "最近更新：",
    lede: "不登录也能看地图、地点和组局。只有打卡、发起或参加组局、举报的时候才需要登录。下面写清楚我们具体存了什么。",
    sections: [
      {
        title: "我们存了什么",
        items: [
          "用 Google 登录时，Google 会提供你的账号名字和邮箱。只用来管理你的账号，邮箱绝不会给别人看。",
          "你的个人资料：自己填的昵称（写名字就行）、可选的一句话介绍、可选的 https 链接、可选的「我是 Next Play 成员」标签，以及语言偏好。",
          "打卡记录：哪个地点、哪天、大概时段（上午／下午／晚上／全天）、想交流什么，以及可选的一句备注。纽约时间午夜后就不再显示，7 天后彻底删除。",
          "你发起或报名的组局，保留到你自己删除或注销账号为止。",
          "你提交的举报，以及推荐的地点或纠错。推荐和纠错不登录也能提交，为了防刷，我们会保存你 IP 地址的单向哈希值，最多 2 天，不保存 IP 本身。",
        ],
      },
      {
        title: "谁能看到",
        items: [
          "没登录的人只能看到人数，比如「今天有 3 人在这儿」，永远看不到名字。",
          "登录的用户能看到正在打卡或报名组局的人的昵称、介绍和链接。任何人登录后都能看到谁在打卡，所以只填你愿意公开的内容就好。",
          "组局发起人能看到谁报名了。",
          "网站管理员会看到举报、推荐和纠错，用来处理内容。被 2 个不同的人举报的内容会自动隐藏。",
        ],
      },
      {
        title: "我们不会做什么",
        items: [
          "没有广告，不卖数据，除了运行网站必需的服务以外不和任何人分享：Supabase（数据库和登录）、Vercel（托管）、Google（登录和地图）。",
          "统计用的是 Vercel Web Analytics：不用 cookie，只统计总浏览量，不会识别到你个人。",
          "地图是从 Google 加载的 Google 地图，适用 Google 自己的隐私政策。",
          "「附近」功能只在你点按钮之后、只在你自己的浏览器里使用你的位置：不会发给我们、Supabase 或统计工具，不会出现在链接里，也不会被保存。",
        ],
      },
      {
        title: "注销账号",
        items: [
          "在个人资料里点「注销账号」，你的账号和所有相关数据（资料、打卡、组局、报名、举报）会立刻删除。",
          "也可以直接发邮件给我们，我们帮你删。",
          "如果想同时撤销本站对你 Google 账号的访问权限：myaccount.google.com → 安全性 → 第三方应用和服务。",
        ],
      },
    ],
    contactTitle: "联系我们",
    contact: "有问题或想删除数据，请发邮件到：",
  },
};
