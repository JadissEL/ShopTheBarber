/** No-op PostCSS for server so Vitest does not load the root config (which requires tailwindcss). */
module.exports = {
  plugins: {},
};
