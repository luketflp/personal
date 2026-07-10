let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project so Next doesn't pick a stray
  // lockfile elsewhere on the machine (silences the multi-lockfile warning).
  outputFileTracingRoot: import.meta.dirname,
  // The OG image routes readFile() these at request time; make sure they end
  // up inside the serverless function bundle on Vercel.
  outputFileTracingIncludes: {
    '/opengraph-image': ['./assets/fonts/inter/*.ttf', './public/hero-me.png'],
    '/q/[slug]/opengraph-image': [
      './assets/fonts/inter/*.ttf',
      './public/hero-me.png',
    ],
  },
  turbopack: {
    root: import.meta.dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
