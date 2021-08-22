module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: "latest"
        }
      }
    ],
    "@babel/preset-react"
  ],
  plugins: ["@babel/plugin-proposal-nullish-coalescing-operator"]
};
