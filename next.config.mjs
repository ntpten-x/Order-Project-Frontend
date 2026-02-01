/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
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
        if (!isServer) {
            // Optimize bundle size
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Common chunk
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                        // Ant Design chunk
                        antd: {
                            name: 'antd',
                            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
                            chunks: 'all',
                            priority: 30,
                        },
                    },
                },
            };
        }
        return config;
    },
};

export default nextConfig;

// Forced restart for config update
