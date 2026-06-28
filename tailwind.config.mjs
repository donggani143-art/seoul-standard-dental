const tailwindConfig = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/tailwind-safelist.txt',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'Outfit', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      colors: {
        accent: '#2563eb', // Platform blue
        base: '#f9fafb',   // Zinc-50 base
        offblack: '#18181b', // Zinc-900
      },
      boxShadow: {
        'diffusion': '0 20px 40px -15px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};

export default tailwindConfig;
