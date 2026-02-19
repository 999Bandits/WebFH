import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "calm-sky-blue": "#5B9BD5",
        "ivory-cream": "#F5F5DC",
        "pearl-grey": "#E8E8E8",
        "soft-coral": "#F08080",
        "calm-sage-green": "#8FBC8F",
      },
    },
  },
  plugins: [],
};
export default config;
