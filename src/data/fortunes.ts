export interface Fortune {
  name: string;
  color: string;
  weight?: number;
  comment?: string;
}

export const fortunes: Fortune[] = [
  { name: "大吉", color: "#ff4d4f", comment: "Everything is going your way", weight: 1 },
  { name: "吉", color: "#ff7a45", comment: "Good luck is on your side", weight: 2 },
  { name: "中吉", color: "#ffc53d", comment: "Not too shabby", weight: 1 },
  { name: "小吉", color: "#bae637", comment: "A little luck goes a long way", weight: 1 },
  { name: "末吉", color: "#5cdbd3", comment: "Patience will bring good things", weight: 1 },
  { name: "凶", color: "#8c8c8c", comment: "Be careful today", weight: 0.5 },
  { name: "大凶", color: "#576574", comment: "Better stay in bed", weight: 0.1 },
];
