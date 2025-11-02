import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Optimize chunk loading
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: isServer ? undefined : 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for large libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Separate chunks for heavy libraries
          mermaid: {
            name: 'mermaid',
            test: /[\\/]node_modules[\\/](mermaid|mermaid-js)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          markmap: {
            name: 'markmap',
            test: /[\\/]node_modules[\\/](markmap-lib|markmap-view|markmap-toolbar|d3)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          betterAuth: {
            name: 'better-auth',
            test: /[\\/]node_modules[\\/](better-auth)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    return config;
  },
  // Increase timeout for chunk loading
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
