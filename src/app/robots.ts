import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://diet-challenge.app' 
    : 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/auth/signup',
          '/legal/*',
        ],
        disallow: [
          '/api/*',
          '/auth/signin',
          '/dashboard/*',
          '/onboarding/*',
          '/record/*',
          '/settings/*',
          '/payment-success/*',
          '/admin/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/auth/signup',
          '/legal/*',
        ],
        disallow: [
          '/api/*',
          '/auth/signin',
          '/dashboard/*',
          '/onboarding/*',
          '/record/*',
          '/settings/*',
          '/payment-success/*',
          '/admin/*',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/auth/signup',
          '/legal/*',
        ],
        disallow: [
          '/api/*',
          '/auth/signin',
          '/dashboard/*',
          '/onboarding/*',
          '/record/*',
          '/settings/*',
          '/payment-success/*',
          '/admin/*',
        ],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
