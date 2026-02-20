// Cloudflare Pages Function for /api/search endpoint
// This replaces the Hono route for proper serverless deployment

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { city, inquiryType } = body;

    // Validation
    if (!city) {
      return new Response(
        JSON.stringify({ error: '市町村名を入力してください' }),
        { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        }
      );
    }

    // Check if API key exists
    if (!env.PERPLEXITY_API_KEY) {
      console.error('❌ PERPLEXITY_API_KEY is not set');
      return new Response(
        JSON.stringify({
          error: 'APIキーが設定されていません',
          department: `${city} の環境課`,
          phone: '市役所の代表電話にお問い合わせください',
          email: null,
          formUrl: null,
          pageUrl: null
        }),
        { 
          status: 404,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        }
      );
    }

    console.log(`🔍 検索開始: ${city}`);

    // Check D1 cache first
    if (env.DB) {
      try {
        const cached = await env.DB.prepare(
          'SELECT departments, page_url, created_at FROM search_cache WHERE city = ?'
        ).bind(city).first();

        if (cached) {
          const departments = JSON.parse(cached.departments);
          const minutesAgo = Math.floor((Date.now() - new Date(cached.created_at).getTime()) / 60000);
          console.log(`💾 キャッシュから取得: ${city} (${minutesAgo}分前のデータ)`);
          
          return new Response(
            JSON.stringify({
              departments,
              pageUrl: cached.page_url,
              cached: true,
              minutesAgo
            }),
            { 
              status: 200,
              headers: { 'content-type': 'application/json; charset=utf-8' }
            }
          );
        }
      } catch (cacheError) {
        console.warn('⚠️ キャッシュ取得エラー:', cacheError.message);
        // Continue to Perplexity API if cache fails
      }
    }

    // Perplexity API search
    const prompt = `以下のJSON形式で、${city}の公式サイトのアスベスト（石綿）${inquiryType || '相談'}窓口情報を抽出してください。

【抽出ルール】
1. 必ず公式サイト（.lg.jpドメイン）から抽出
2. 推測は一切禁止。見つからない項目は "missing" とマーク
3. 各項目に根拠URL・抜粋を必ず付与
4. 電話番号は半角ハイフン形式（例: 045-123-4567）
5. メールアドレスは @ 形式に統一
6. ラベル（「TEL:」「電話:」など）は除去

【検索手順】
1. ${city}の公式サイト内で「石綿 相談」「アスベスト 窓口」を検索
2. 環境課・建築指導課のページを優先
3. 公式ページが見つからない場合のみ都道府県の窓口を探す（その場合は flags に "fallback_to_prefecture" を追加）

【出力JSON形式】
{
  "municipality": "${city}",
  "intent_type": "${inquiryType || '相談'}",
  "recommended": {
    "department": "担当部署名（正式名称）",
    "phone": "045-123-4567",
    "email": "example@city.lg.jp",
    "inquiry_form_url": "https://...",
    "url": "https://www.city.xxx.lg.jp/...",
    "evidence_snippet": "ページから抽出した文章（30-120文字）",
    "notes": "補足情報"
  },
  "candidates": [],
  "missing": [
    {"field": "email", "reason": "ページにメールアドレスの記載なし"}
  ],
  "flags": ["only_main_phone", "form_only"],
  "reason": "推奨した理由",
  "last_checked": "${new Date().toISOString()}"
}

必ず上記のJSON形式のみを出力してください。`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: '日本の自治体の公式サイトから、アスベスト相談窓口情報を抽出する専門家です。必ず公式ドメイン（.lg.jp）を優先し、推測は一切行いません。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        return_citations: true,
        search_domain_filter: [
          'lg.jp',
          'go.jp',
          'pref.kanagawa.jp',
          'city.yokohama.lg.jp',
          'city.kawasaki.jp',
          'city.fujisawa.kanagawa.jp',
          'city.miura.kanagawa.jp',
          'city.isehara.kanagawa.jp',
          'city.minamiashigara.kanagawa.jp'
        ],
        search_recency_filter: 'year'
      })
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error(`❌ Perplexity APIエラー: ${perplexityResponse.status}`, errorText);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const data = await perplexityResponse.json();
    console.log(`📝 AI応答取得: ${city}`);
    console.log(`🔧 Perplexity完全レスポンス:`, JSON.stringify(data, null, 2));
    console.log(`📊 Citations数: ${data.citations?.length || 0}`);
    if (data.citations) {
      console.log(`📎 Citations:`, data.citations.map(c => c.url || c).join(', '));
    }

    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    let jsonData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                       aiResponse.match(/```\n?([\s\S]*?)\n?```/) ||
                       [null, aiResponse];
      jsonData = JSON.parse(jsonMatch[1]);
    } catch (parseError) {
      console.warn('⚠️ JSON解析失敗、フォールバック処理実行');
      // Fallback: parse traditional format
      jsonData = parseLegacyFormat(aiResponse, city);
    }

    // Extract departments from structured JSON
    const departments = [];
    if (jsonData.recommended && jsonData.recommended.department !== 'missing') {
      departments.push({
        category: jsonData.intent_type || '相談窓口',
        name: jsonData.recommended.department,
        phone: jsonData.recommended.phone !== 'missing' ? jsonData.recommended.phone : null,
        email: jsonData.recommended.email !== 'missing' ? jsonData.recommended.email : null,
        formUrl: jsonData.recommended.inquiry_form_url !== 'missing' ? jsonData.recommended.inquiry_form_url : null
      });
    }

    // Add candidates if available
    if (jsonData.candidates && jsonData.candidates.length > 0) {
      jsonData.candidates.forEach(candidate => {
        if (candidate.department !== 'missing') {
          departments.push({
            category: candidate.category || '追加窓口',
            name: candidate.department,
            phone: candidate.phone !== 'missing' ? candidate.phone : null,
            email: candidate.email !== 'missing' ? candidate.email : null,
            formUrl: candidate.inquiry_form_url !== 'missing' ? candidate.inquiry_form_url : null
          });
        }
      });
    }

    const pageUrl = jsonData.recommended?.url || extractUrlFromText(aiResponse);

    console.log(`✅ 抽出完了: ${departments.length}件の部署`);

    // Save to D1 cache
    if (env.DB && departments.length > 0) {
      try {
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO search_cache (city, departments, page_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(city) DO UPDATE SET
            departments = excluded.departments,
            page_url = excluded.page_url,
            updated_at = excluded.updated_at
        `).bind(
          city,
          JSON.stringify(departments),
          pageUrl,
          now,
          now
        ).run();
        console.log(`💾 キャッシュ保存成功: ${city}`);
      } catch (dbError) {
        console.warn('⚠️ D1保存エラー:', dbError.message);
      }
    }

    if (departments.length === 0) {
      return new Response(
        JSON.stringify({
          error: '窓口情報が見つかりませんでした',
          department: `${city} の環境課`,
          phone: '市役所の代表電話にお問い合わせください',
          email: null,
          formUrl: null,
          pageUrl: pageUrl
        }),
        { 
          status: 404,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        departments,
        pageUrl
      }),
      { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      }
    );

  } catch (error) {
    console.error('❌ Search error:', error);
    
    return new Response(
      JSON.stringify({
        error: `検索中にエラーが発生しました: ${error.message}`,
        department: `${body.city || ''} の環境課`,
        phone: '市役所の代表電話にお問い合わせください',
        email: null,
        formUrl: null,
        pageUrl: null
      }),
      { 
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      }
    );
  }
}

// CORS preflight handler
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

// Helper: Parse legacy format (fallback)
function parseLegacyFormat(text, city) {
  const lines = text.split('\n').filter(line => line.trim());
  const departments = [];
  let currentDept = {};

  for (const line of lines) {
    if (line.includes('カテゴリ:') || line.includes('分類:')) {
      if (currentDept.name) departments.push(currentDept);
      currentDept = { category: line.split(':')[1]?.trim() };
    } else if (line.includes('担当部署:') || line.includes('部署名:')) {
      currentDept.name = line.split(':')[1]?.trim();
    } else if (line.includes('電話番号:') || line.includes('TEL:')) {
      currentDept.phone = line.split(':')[1]?.trim();
    } else if (line.includes('メール:') || line.includes('Email:')) {
      currentDept.email = line.split(':')[1]?.trim();
    }
  }
  
  if (currentDept.name) departments.push(currentDept);

  return {
    municipality: city,
    intent_type: '相談',
    recommended: departments[0] || { department: 'missing' },
    candidates: departments.slice(1),
    missing: [],
    flags: ['legacy_format'],
    reason: 'フォールバック処理',
    last_checked: new Date().toISOString()
  };
}

// Helper: Extract URL from text
function extractUrlFromText(text) {
  const urlPatterns = [
    /公式ページURL[：:]\s*(https?:\/\/[^\s]+)/,
    /URL[：:]\s*(https?:\/\/[^\s]+)/,
    /(https?:\/\/[^\s]+\.lg\.jp[^\s]*)/
  ];

  for (const pattern of urlPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/[)）」』】、。，]+$/, '');
    }
  }

  return null;
}
