export interface Fortune {
  text: string;
  color: string;
  imageSrc?: string;
  additionalText?: string;
}

export const fortunes: Fortune[] = [
  { text: "大吉", color: "#ff4d4f", additionalText: "Everything is going your way", imageSrc: "" },
  { text: "吉", color: "#ff7a45", additionalText: "Good luck is on your side", imageSrc: "" },
  { text: "中吉", color: "#ffc53d", additionalText: "Not too shabby", imageSrc: "" },
  { text: "小吉", color: "#bae637", additionalText: "A little luck goes a long way", imageSrc: "" },
  { text: "末吉", color: "#5cdbd3", additionalText: "Patience will bring good things", imageSrc: "" },
  { text: "凶", color: "#8c8c8c", additionalText: "Be careful today", imageSrc: "" },
  { text: "大凶", color: "#576574", additionalText: "Better stay in bed", imageSrc: "" },
];
