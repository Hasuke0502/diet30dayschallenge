import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://diet-challenge.app' 
    : 'http://localhost:3000'

  const currentDate = new Date()

  return [
    // ホームページ（最も重要）
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    
    // サインアップページ（コンバージョンページ）
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    
    // 法的ページ群
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date('2025-08-09'), // 最終更新日に基づく
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacy-policy`,
      lastModified: new Date('2025-08-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/commercial-transactions`,
      lastModified: new Date('2025-08-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}

// 動的なサイトマップ生成のための型定義
export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

// 将来的に動的コンテンツ（ブログ記事など）を追加する場合の関数
export async function generateDynamicSitemap(): Promise<SitemapEntry[]> {
  // 現在は静的ページのみだが、将来的にブログやお知らせページを追加する場合
  // データベースからコンテンツを取得してサイトマップエントリを生成
  
  const dynamicEntries: SitemapEntry[] = []
  
  // 例：ブログ記事の取得
  // const posts = await getBlogPosts()
  // posts.forEach(post => {
  //   dynamicEntries.push({
  //     url: `${baseUrl}/blog/${post.slug}`,
  //     lastModified: post.updatedAt,
  //     changeFrequency: 'monthly',
  //     priority: 0.6,
  //   })
  // })
  
  return dynamicEntries
}
