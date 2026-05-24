/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#FFF8F2",
        cream: "#FFE9DA",
        peach: "#FFB89A",
        coral: "#FF7E5F",
        sunset: "#FF5E78",
        flamingo: "#FF3D8A",
        magenta: "#E1306C",
        plum: "#2B1437",
        ink: "#1A0B22",
        palm: "#0E7C66",
        ocean: "#1E96A8",
      },
      fontFamily: {
        display: ["Fraunces", "Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 20px 60px -20px rgba(255, 94, 120, 0.45)",
        soft: "0 8px 30px -10px rgba(43, 20, 55, 0.15)",
      },
      backgroundImage: {
        sunset: "linear-gradient(135deg, #FFE9DA 0%, #FFB89A 40%, #FF7E5F 75%, #FF3D8A 100%)",
        sunsetSoft: "linear-gradient(135deg, #FFF8F2 0%, #FFE9DA 60%, #FFD2BC 100%)",
        sky: "linear-gradient(180deg, #FFE9DA 0%, #FFC1A1 60%, #FF8E7D 100%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};
