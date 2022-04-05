module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  purge: {
    enabled: true,
    content: ["./src/**/*.tsx"],
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
