import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ダイエット30日チャレンジ - マネーモンスターを倒してお金と健康を取り戻そう'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          ダイエット30日チャレンジ
        </div>
        
        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '40px',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: '1.3',
          }}
        >
          マネーモンスターを倒して<br />お金と健康を取り戻そう！
        </div>
        
        {/* Main Visual */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Monster */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              marginRight: '40px',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            💀
          </div>
          
          {/* VS */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#FCD34D',
              marginRight: '40px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            VS
          </div>
          
          {/* Hero */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            💪
          </div>
        </div>
        
        {/* Features */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>📅</div>
            <div style={{ fontSize: '16px', textAlign: 'center' }}>30日間</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>💰</div>
            <div style={{ fontSize: '16px', textAlign: 'center' }}>返金制度</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>🎮</div>
            <div style={{ fontSize: '16px', textAlign: 'center' }}>ゲーム要素</div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            padding: '15px 30px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#8B5CF6',
            }}
          >
            今すぐチャレンジ開始！
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
