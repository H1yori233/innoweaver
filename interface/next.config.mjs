/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_URL: 'http://120.55.193.195:5000',
        // API_URL: 'http://localhost:5000',
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
};

export default nextConfig;
