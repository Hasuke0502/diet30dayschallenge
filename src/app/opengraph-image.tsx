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
            marginBottom: '60px',
            textAlign: 'center',
          }}
        >
          マネーモンスターを倒してお金と健康を取り戻そう！
        </div>
        
        {/* Monster vs Hero Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '600px',
            marginBottom: '60px',
          }}
        >
          {/* Monster */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                marginBottom: '10px',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              💀
            </div>
            <div
              style={{
                color: '#FCD34D',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              マネーモンスター
            </div>
          </div>
          
          {/* VS */}
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FCD34D',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            VS
          </div>
          
          {/* Hero */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                marginBottom: '10px',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              💪
            </div>
            <div
              style={{
                color: '#10B981',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              あなた
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '40px',
            padding: '20px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#8B5CF6',
              marginBottom: '8px',
            }}
          >
            今すぐチャレンジ開始！
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#6B7280',
            }}
          >
            30日間で健康とお金を取り戻そう
          </div>
        </div>
        
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '50px',
            fontSize: '36px',
            opacity: 0.3,
          }}
        >
          ¥
        </div>
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '50px',
            fontSize: '36px',
            opacity: 0.3,
          }}
        >
          ¥
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '100px',
            fontSize: '28px',
            opacity: 0.3,
          }}
        >
          📈
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            right: '100px',
            fontSize: '28px',
            opacity: 0.3,
          }}
        >
          🎯
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
