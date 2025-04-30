import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		spacing: {
  			'96': '24rem',
  			'128': '32rem'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {},
  		animation: {
  			shine: 'shine var(--duration) infinite linear'
  		},
  		keyframes: {
  			shine: {
  				'0%': {
  					'background-position': '0% 0%'
  				},
  				'50%': {
  					'background-position': '100% 100%'
  				},
  				to: {
  					'background-position': '0% 0%'
  				}
  			}
  		}
  	}
  },
  plugins: [
    require('tailwindcss-themer')({
      defaultTheme: {
        extend: {
          colors: {
            primary: "#171717",
            secondary: "#262626",
            border: {
              primary: "#4B5563",
              secondary: "#9CA3AF",
              line: "#FFFFFF",
            },
            text: {
              primary: "#FFFFFF",
              secondary: "#D1D5DB",
              placeholder: "#9CA3AF",
              link: "#77EEFF",
              linkHover: "#4BB3FD",
            },
            scrollbar: {
              thumb: "#4B5563",
              thumbHover: "#6B7280",
              track: "#1F2937",
              width: "8px",
              radius: "4px",
            },
          },
          boxShadow: {
            primary: "0 1px 10px rgba(255, 255, 255, 0.5)",
          },
        },
      },
      themes: [
        {
          name: "light",
          extend: {
            colors: {
              primary: "#F9FAFB",
              secondary: "#E5E7EB",
              border: {
                primary: "#D1D5DB",
                secondary: "#9CA3AF",
                line: "#1F2937",
              },
              text: {
                primary: "#1F2937",
                secondary: "#4B5563",
                placeholder: "#6B7280",
                link: "#3B82F6",
                linkHover: "#2563EB",
              },
              scrollbar: {
                thumb: "#D1D5DB",
                thumbHover: "#9CA3AF",
                track: "#F3F4F6",
                width: "8px",
                radius: "4px",
              },
            },
            boxShadow: {
              primary: "0 1px 10px rgba(0, 0, 0, 0.5)",
            },
          },
        },
        {
          name: "dark",
          extend: {
            colors: {
              primary: "#171717",
              secondary: "#262626",
              border: {
                primary: "#4B5563",
                secondary: "#9CA3AF",
                line: "#FFFFFF",
              },
              text: {
                primary: "#FFFFFF",
                secondary: "#D1D5DB",
                placeholder: "#9CA3AF",
                link: "#77EEFF",
                linkHover: "#4BB3FD",
              },
              scrollbar: {
                thumb: "#4B5563",
                thumbHover: "#6B7280",
                track: "#1F2937",
                width: "8px",
                radius: "4px",
              },
            },
            boxShadow: {
              primary: "0 1px 10px rgba(255, 255, 255, 0.5)",
            },
          },
        },
      ],
    }),
    require("tailwindcss-animate"),
    require('tailwind-scrollbar'),
    function({ addBase, theme }) {
      addBase({
        ':root': {
          '--scrollbar-thumb': theme('colors.scrollbar.thumb'),
          '--scrollbar-thumb-hover': theme('colors.scrollbar.thumbHover'),
          '--scrollbar-track': theme('colors.scrollbar.track'),
          '--scrollbar-width': theme('colors.scrollbar.width'),
          '--scrollbar-radius': theme('colors.scrollbar.radius'),
        },
      });
    }
  ],
};
export default config;
