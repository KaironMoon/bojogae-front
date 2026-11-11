// Compile copied reference utilities without changing the application's global styles.
// npx --yes --package tailwindcss@3.4.17 tailwindcss -c src/pages/groups/kkomak/tailwind.config.cjs -i src/pages/groups/kkomak/wallet-input.css -o src/pages/groups/kkomak/wallet-utilities.css --minify
module.exports = {
  content: [__dirname + '/*.jsx', __dirname + '/../MyCoinsPage.jsx'],
  important: '.kkomak-design',
  corePlugins: { preflight: false },
  theme: { extend: { colors: { primary: '#03c75a', sub: '#6b38fb', 'primary-soft': '#ecfdf5', 'sub-soft': '#f5f3ff' } } },
};
