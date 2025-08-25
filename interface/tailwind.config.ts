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
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'], // Styrene alternative
        'sans': ['Space Grotesk', 'system-ui', 'sans-serif'],     // For UI elements
        'serif': ['Crimson Pro', 'Georgia', 'serif'],             // Tiempos alternative
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
      },
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '0.75rem', letterSpacing: '0.05em' }],
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'organic': '20px',
      },
      backgroundImage: {
        'organic-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'mesh-gradient': `
          radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.3) 0px, transparent 0%),
          radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.2) 0px, transparent 50%),
          radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.2) 0px, transparent 50%),
          radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.3) 0px, transparent 50%),
          radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.2) 0px, transparent 50%),
          radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.2) 0px, transparent 50%),
          radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.3) 0px, transparent 50%)
        `,
        'texture': `
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
    }
  },
  plugins: [
    require('tailwindcss-themer')({
      defaultTheme: {
        extend: {
          colors: {
            // Base color scheme - warm neutral colors
            canvas: "#FEFDF8",  // Creamy white canvas
            paper: "#F8F7F2",   // Paper texture
            stone: "#E8E5DB",   // Stone color
            ash: "#C7C3B8",     // Ash color
            charcoal: "#2A2926", // Charcoal color
            ink: "#1A1917",     // Ink color
            
            // Organic color system
            organic: {
              clay: "#D4A574",    // Clay color
              sage: "#8FA68E",    // Sage green
              rust: "#B85C57",    // Rust color
              moss: "#6B7A5A",    // Moss color
              sand: "#E6D4B7",    // Sand color
              storm: "#556B5D",   // Storm color
            },
            
            // Functional colors
            accent: {
              primary: "#4A5D6B",    // Primary accent color - deep blue gray
              secondary: "#8FA68E",  // Secondary accent color - sage
              tertiary: "#D4A574",   // Tertiary accent color - clay
            },
            
            // Status colors - more natural tones
            success: "#6B8A3A",  // Olive green
            warning: "#C4956C",  // Caramel color  
            error: "#A85A52",    // Deep red brown
            info: "#5A7B8C",     // Steel blue
            
            // Interface elements
            surface: {
              primary: "#FEFDF8",
              secondary: "#F8F7F2", 
              tertiary: "#F0EFE8",
              elevated: "#FFFFFF",
            },
            
            border: {
              subtle: "#E8E5DB",
              default: "#C7C3B8",
              strong: "#A89F91",
            },
            
            text: {
              primary: "#1A1917",
              secondary: "#4A453E", 
              tertiary: "#6B635A",
              placeholder: "#8A8077",
              inverse: "#FEFDF8",
            },
          }
        }
      },
      themes: [
        {
          name: "light",
          extend: {
            colors: {
              canvas: "#FEFDF8",
              paper: "#F8F7F2", 
              stone: "#E8E5DB",
              ash: "#C7C3B8",
              charcoal: "#2A2926",
              ink: "#1A1917",
              
              organic: {
                clay: "#D4A574",
                sage: "#8FA68E", 
                rust: "#B85C57",
                moss: "#6B7A5A",
                sand: "#E6D4B7",
                storm: "#556B5D",
              },
              
              accent: {
                primary: "#4A5D6B",
                secondary: "#8FA68E",
                tertiary: "#D4A574", 
              },
              
              success: "#6B8A3A",
              warning: "#C4956C",
              error: "#A85A52", 
              info: "#5A7B8C",
              
              surface: {
                primary: "#FEFDF8",
                secondary: "#F8F7F2",
                tertiary: "#F0EFE8", 
                elevated: "#FFFFFF",
              },
              
              border: {
                subtle: "#E8E5DB",
                default: "#C7C3B8",
                strong: "#A89F91",
              },
              
              text: {
                primary: "#1A1917",
                secondary: "#4A453E",
                tertiary: "#6B635A", 
                placeholder: "#8A8077",
                inverse: "#FEFDF8",
              },
            }
          }
        },
        {
          name: "dark", 
          extend: {
            colors: {
              canvas: "#0F0E0C",
              paper: "#1A1917",
              stone: "#2A2926", 
              ash: "#3D3A35",
              charcoal: "#C7C3B8",
              ink: "#FEFDF8",
              
              organic: {
                clay: "#E6B886",
                sage: "#A1B89E",
                rust: "#C96B66", 
                moss: "#7B8A69",
                sand: "#F0E0C9",
                storm: "#6B7D71",
              },
              
              accent: {
                primary: "#6B8CA3",
                secondary: "#A1B89E",
                tertiary: "#E6B886",
              },
              
              success: "#7A9B4A", 
              warning: "#D4A67C",
              error: "#B86962",
              info: "#6A8B9C",
              
              surface: {
                primary: "#0F0E0C",
                secondary: "#1A1917",
                tertiary: "#252320",
                elevated: "#2A2926",
              },
              
              border: {
                subtle: "#2A2926", 
                default: "#3D3A35",
                strong: "#524F48",
              },
              
              text: {
                primary: "#FEFDF8",
                secondary: "#C7C3B8",
                tertiary: "#A89F91",
                placeholder: "#6B635A", 
                inverse: "#1A1917",
              },
            }
          }
        }
      ]
    }),
    require("tailwindcss-animate"),
    // Custom utility plugin
    function({ addUtilities, theme }) {
      addUtilities({
        '.text-balance': {
          textWrap: 'balance',
        },
        '.organic-shadow': {
          boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`,
        },
        '.glass-morphism': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.125)',
        },
        '.glass-morphism-dark': {
          backdropFilter: 'blur(12px)', 
          backgroundColor: 'rgba(15, 14, 12, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.125)',
        },
      })
    }
  ],
};

export default config;
