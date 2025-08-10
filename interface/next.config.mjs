/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        // API_URL: 'http://120.55.193.195:5000',
        API_URL: 'http://localhost:5000',
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 's2.loli.net',
            },
        ],
    },
    experimental: {
        webpackBuildWorker: true,
        parallelServerBuildTraces: true,
        parallelServerCompiles: true,
    },
    webpack: (config, { isServer }) => {
        // Handle PDF.js worker and other assets
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };
        }
        
        // Handle .mjs files from PDF.js
        config.module.rules.push({
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
        });
        
        return config;
    },
};

export default nextConfig;
