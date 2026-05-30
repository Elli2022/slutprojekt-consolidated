export const avatarOptions = [
  {
    label: "Ember",
    url: "https://api.dicebear.com/9.x/glass/svg?seed=Ember",
  },
  {
    label: "Harbor",
    url: "https://api.dicebear.com/9.x/glass/svg?seed=Harbor",
  },
  {
    label: "Juniper",
    url: "https://api.dicebear.com/9.x/glass/svg?seed=Juniper",
  },
  {
    label: "Atlas",
    url: "https://api.dicebear.com/9.x/glass/svg?seed=Atlas",
  },
];

export function toAvatarUrl(seed: string): string {
  const safeSeed = encodeURIComponent(seed.trim() || "Signal Social");
  return `https://api.dicebear.com/9.x/glass/svg?seed=${safeSeed}`;
}

export const defaultAvatarUrl = avatarOptions[0].url;
