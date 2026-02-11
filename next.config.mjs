/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            }
        ],
        // Image optimization settings
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // Code splitting optimization
    experimental: {
        optimizePackageImports: ['antd', '@ant-design/icons'],
    },
    // Compression
    compress: true,
    // Production optimizations
    productionBrowserSourceMaps: false,
    // Webpack optimizations
    webpack: (config, { isServer }) => {
        // Next.js default optimizations are usually sufficient.
        // Custom splitChunks can sometimes cause issues with CSS/JS injection.
        return config;
    },
};

export default nextConfig;

// Forced restart for config update
