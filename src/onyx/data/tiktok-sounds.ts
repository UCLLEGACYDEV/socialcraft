export interface TikTokSoundItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: "trending" | "business" | "lofi" | "upbeat" | "synthwave" | "acoustic";
  categoryLabel: string;
  previewUrl: string;
  commercialApproved: boolean;
  plays: string;
  coverUrl?: string;
  tag?: string;
}

export const TIKTOK_MUSIC_LIBRARY: TikTokSoundItem[] = [
  {
    id: "tt-sound-1",
    title: "Neon Horizon (Viral Beat)",
    artist: "SynthWave Pulse",
    duration: "0:30",
    category: "trending",
    categoryLabel: "Trending & Viral",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    commercialApproved: true,
    plays: "3.4M",
    tag: "🔥 Hot",
  },
  {
    id: "tt-sound-2",
    title: "Deep Focus & Mindset",
    artist: "Minimal Tech Studio",
    duration: "0:45",
    category: "business",
    categoryLabel: "Business & Motivation",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-raising-me-higher-34.mp3",
    commercialApproved: true,
    plays: "1.8M",
    tag: "💼 Business",
  },
  {
    id: "tt-sound-3",
    title: "Midnight Coffee Lo-Fi",
    artist: "Chill Beats Collective",
    duration: "0:38",
    category: "lofi",
    categoryLabel: "Lo-Fi & Aesthetic",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-silent-descent-614.mp3",
    commercialApproved: true,
    plays: "2.7M",
    tag: "☕ Aesthetic",
  },
  {
    id: "tt-sound-4",
    title: "Cyberpunk Night Drive",
    artist: "NeoTokyo Sound",
    duration: "0:35",
    category: "synthwave",
    categoryLabel: "Synthwave & 3D",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3",
    commercialApproved: true,
    plays: "1.2M",
    tag: "⚡ High Energy",
  },
  {
    id: "tt-sound-5",
    title: "Upbeat Future Bass",
    artist: "Aura Motion",
    duration: "0:28",
    category: "upbeat",
    categoryLabel: "Upbeat Pop & House",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3",
    commercialApproved: true,
    plays: "4.1M",
    tag: "🚀 Viral Pop",
  },
  {
    id: "tt-sound-6",
    title: "Organic Morning Breeze",
    artist: "Acoustic Craft",
    duration: "0:40",
    category: "acoustic",
    categoryLabel: "Acoustic & Warm",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
    commercialApproved: true,
    plays: "890K",
    tag: "🌿 Storytelling",
  },
  {
    id: "tt-sound-7",
    title: "Hustle & Scale (Modern Trap)",
    artist: "Krown Beats",
    duration: "0:32",
    category: "business",
    categoryLabel: "Business & Motivation",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3",
    commercialApproved: true,
    plays: "2.1M",
    tag: "📈 Growth",
  },
  {
    id: "tt-sound-8",
    title: "Dreamscape Carousel",
    artist: "Lofi Blossom",
    duration: "0:36",
    category: "lofi",
    categoryLabel: "Lo-Fi & Aesthetic",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
    commercialApproved: true,
    plays: "1.5M",
    tag: "✨ Chill",
  },
];
