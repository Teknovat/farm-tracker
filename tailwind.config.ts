import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
            },
        },
    },
    plugins: [
        // Add RTL support plugin
        function ({ addUtilities }: { addUtilities: any }) {
            const newUtilities = {
                '.rtl': {
                    direction: 'rtl',
                },
                '.ltr': {
                    direction: 'ltr',
                },
                // RTL-aware spacing utilities
                '.ms-auto': {
                    'margin-inline-start': 'auto',
                },
                '.me-auto': {
                    'margin-inline-end': 'auto',
                },
                '.ps-4': {
                    'padding-inline-start': '1rem',
                },
                '.pe-4': {
                    'padding-inline-end': '1rem',
                },
                '.border-s': {
                    'border-inline-start-width': '1px',
                },
                '.border-e': {
                    'border-inline-end-width': '1px',
                },
            }
            addUtilities(newUtilities)
        }
    ],
}
export default config