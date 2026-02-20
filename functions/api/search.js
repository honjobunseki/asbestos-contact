// Cloudflare Pages Function - /api/search POST handler
// D1キャッシュ + Perplexity検索 + URLスコアリング統合版

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { city } = body;

  // バリデーション
  if (!city) {
    return new Response(JSON.stringify({
      error: '市区町村名を指定してください'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // PERPLEXITY_API_KEY確認
  if (!env.PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY が設定されていません');
    return new Response(JSON.stringify({
      error: 'PERPLEXITY_API_KEYが設定されていません。Cloudflare Pagesの環境変数で設定してください。',
      department: '神奈川県庁',
      phone: '045-210-4111',
      email: null,
      formUrl: null,
      pageUrl: null
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  console.log(`🔍 検索開始: ${city}`);

  // 1. D1 キャッシュチェック
  if (env.DB) {
    try {
      const cacheResult = await env.DB
        .prepare('SELECT departments, page_url, created_at FROM search_cache WHERE city = ? LIMIT 1')
        .bind(city)
        .first();

      if (cacheResult) {
        const departments = JSON.parse(cacheResult.departments);
        const cacheAge = Math.floor((Date.now() - new Date(cacheResult.created_at).getTime()) / 60000);
        console.log(`✅ D1キャッシュヒット: ${city} (${cacheAge}分前)`);

        return new Response(JSON.stringify({
          departments,
          pageUrl: cacheResult.page_url,
          cached: true,
          cacheAge
        }), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    } catch (error) {
      console.warn('⚠️ D1キャッシュ取得エラー:', error);
    }
  }

  // 2. Perplexity API検索
  try {
    const cityDomain = getCityDomain(city);
    const searchQuery = cityDomain ? 
      `site:${cityDomain} アスベスト 相談 問い合わせ 窓口` :
      `${city} アスベスト 相談 窓口 公式サイト`;

    console.log(`🔍 Perplexity検索クエリ: ${searchQuery}`);

    const prompt = `
あなたは自治体の公式サイトから正確な情報を抽出する専門家です。以下のルールに従って、${city}のアスベスト（石綿）相談窓口の情報を抽出してください。

【検索・選定の手順（必須）】
① ${city}の公式サイトでまず窓口関連キーワード（"問い合わせ"、"連絡先"、"窓口"、"担当課"、"相談窓口"）を検索し、次に石綿関連キーワード（"石綿"、"アスベスト"、"相談"、"通報"）を検索する。
② 公式ページが複数ある場合は、1) 「石綿（アスベスト）相談窓口」明示ページ、2) 「建築物の解体等に伴う石綿」担当課ページ、3) 環境・廃棄物・公害などの担当課ページ、4) それでも無い場合は都道府県の石綿相談窓口ページ、の順に候補化する。
③ 非公式サイトは推奨しない。

【重要な検索ルール】
- Citations中から「アスベスト」「石綿」「相談」「窓口」等の用語を含むURLを優先的に選択
- 「野焼き」「屋外焼却」「ごみ」等のアスベストと無関係な用語を含むURLは除外
- Citations が複数ある場合、タイトル・スニペットから最も適切なURLを選択
- 選択されたURLからのみ情報を抽出（URLが404やリダイレクトの場合はmissingとして記録）

【抽出項目】
- department: 担当部署名（例: "環境部 環境保全課"）
- phone: 電話番号（直通・代表・内線を含む、複数ある場合は改行で区切る）
- email: メールアドレス（無ければ空文字列、フォームのみの場合はinquiry_form_urlに記載）
- inquiry_form_url: 問い合わせフォームのURL（無ければ空文字列）
- hours: 受付時間（例: "平日 8:30-17:15"、無ければ空文字列）
- address: 所在地（無ければ空文字列）
- notes: 補足情報（無ければ空文字列）
- category: "相談" / "通報" / "届出" / "その他"

【担当部署抽出ルール】
- ラベルが無くても「担当課」「担当」「所管」「窓口」「問い合わせ」等の語の直後/周辺にある課・係名をdepartmentとする
- department は 1) "○○課" / "○○室" / "○○係" 等の組織名、2) 階層表記（例: "○○部 ○○課"）を含め、3) 取得できなければmissingとし推測禁止
- 連絡先が無いページは窓口ページとして不採用

【missing記録ルール】
- missingには必ず {"field": <field>, "reason": <理由>} を付与
- flags: "no_department_label", "contact_info_in_pdf_or_image", "page_has_no_contact_section", "fetch_failed", "fallback_to_prefecture" 等を使用

【正規化ルール】
- phone: ハイフン統一、内線は "(内線123)" 形式
- email: 小文字統一、@の前後の空白除去
- URL: https:// で開始、末尾の "/" は削除、不要なクエリパラメータ除去

【重要】
- 公式ページのURL（pageUrl）は検索結果から抽出した正確なURLを返すこと
- 市町村のトップページや存在しないURLを返さないこと
- URLが404や到達不可の場合は、"missing" として記録し、理由を明記すること

【出力形式（JSON のみ）】
必ず以下の形式で出力し、説明文などは一切含めないこと：

{
  "departments": [
    {
      "name": "担当部署名",
      "phone": "電話番号",
      "email": "メールアドレス",
      "formUrl": "問い合わせフォームURL",
      "category": "相談"
    }
  ],
  "pageUrl": "正確な公式ページURL",
  "missing": [],
  "flags": []
}
`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'あなたは日本の自治体の公式サイトから正確な情報を抽出する専門家です。.lg.jp, .go.jp ドメインの情報のみを信頼してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        search_domain_filter: [
          "lg.jp",
          "go.jp",
          "pref.kanagawa.jp",
          "city.yokohama.lg.jp",
          "city.kawasaki.jp",
          "city.fujisawa.kanagawa.jp",
          "city.miura.kanagawa.jp",
          "city.isehara.kanagawa.jp",
          "city.minamiashigara.kanagawa.jp",
          "city.zama.kanagawa.jp"
        ],
        search_recency_filter: "year",
        return_citations: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const jsonData = await response.json();
    console.log('🔧 Perplexity完全レスポンス:', JSON.stringify(jsonData, null, 2));

    const aiResponse = jsonData.choices?.[0]?.message?.content || '';
    const citations = jsonData.citations || [];

    console.log('📊 Citations数:', citations.length);
    citations.forEach((url, i) => {
      console.log(`📎 Citation[${i}]:`, url);
    });

    // JSONパース
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON形式のレスポンスが見つかりません');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ JSONパースエラー:', parseError);
      console.log('🔍 AIレスポンス:', aiResponse);
      throw new Error('AIレスポンスのJSONパースに失敗しました');
    }

    const departments = parsedData.departments || [];
    console.log(`📊 抽出された部署数: ${departments.length}`);

    // URLスコアリングで最適なURLを選択
    const pageUrl = selectBestUrl(citations, city);
    console.log('✅ スコアリング選出URL:', pageUrl);

    // URL正規化
    const normalizedUrl = normalizeUrl(pageUrl);
    console.log('✅ 正規化後URL:', normalizedUrl);

    // 3. D1キャッシュに保存
    if (env.DB && departments.length > 0) {
      try {
        await env.DB
          .prepare('INSERT OR REPLACE INTO search_cache (city, departments, page_url, created_at) VALUES (?, ?, ?, datetime("now"))')
          .bind(city, JSON.stringify(departments), normalizedUrl)
          .run();
        console.log(`✅ D1キャッシュ保存成功: ${city}`);
      } catch (error) {
        console.warn('⚠️ D1キャッシュ保存エラー:', error);
      }
    }

    return new Response(JSON.stringify({
      departments,
      pageUrl: normalizedUrl,
      cached: false
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (error) {
    console.error('❌ 検索エラー:', error);
    return new Response(JSON.stringify({
      error: '検索中にエラーが発生しました',
      department: '神奈川県庁',
      phone: '045-210-4111',
      email: null,
      formUrl: null,
      pageUrl: null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// ヘルパー関数: 市区町村 → ドメイン
function getCityDomain(cityName) {
  const cityDomainMap = {
    '横浜市': 'city.yokohama.lg.jp',
    '川崎市': 'city.kawasaki.jp',
    '相模原市': 'city.sagamihara.kanagawa.jp',
    '横須賀市': 'city.yokosuka.kanagawa.jp',
    '平塚市': 'city.hiratsuka.kanagawa.jp',
    '鎌倉市': 'city.kamakura.kanagawa.jp',
    '藤沢市': 'city.fujisawa.kanagawa.jp',
    '小田原市': 'city.odawara.kanagawa.jp',
    '茅ヶ崎市': 'city.chigasaki.kanagawa.jp',
    '逗子市': 'city.zushi.kanagawa.jp',
    '三浦市': 'city.miura.kanagawa.jp',
    '秦野市': 'city.hadano.kanagawa.jp',
    '厚木市': 'city.atsugi.kanagawa.jp',
    '大和市': 'city.yamato.kanagawa.jp',
    '伊勢原市': 'city.isehara.kanagawa.jp',
    '海老名市': 'city.ebina.kanagawa.jp',
    '座間市': 'city.zama.kanagawa.jp',
    '南足柄市': 'city.minamiashigara.kanagawa.jp',
    '綾瀬市': 'city.ayase.kanagawa.jp',
    '葉山町': 'town.hayama.kanagawa.jp',
    '寒川町': 'town.samukawa.kanagawa.jp',
    '大磯町': 'town.oiso.kanagawa.jp',
    '二宮町': 'town.ninomiya.kanagawa.jp',
    '中井町': 'town.nakai.kanagawa.jp',
    '大井町': 'town.oi.kanagawa.jp',
    '松田町': 'town.matsuda.kanagawa.jp',
    '山北町': 'town.yamakita.kanagawa.jp'
  };

  const cleanedCity = cityName.replace(/^.+?(都|道|府|県)/, '');
  return cityDomainMap[cleanedCity] || null;
}

// ヘルパー関数: URLスコアリング
function scoreCitationUrl(url, title, snippet, city) {
  let score = 0;
  const text = `${title} ${snippet}`.toLowerCase();

  // アスベスト関連キーワード
  if (text.includes('アスベスト') || text.includes('石綿')) score += 100;
  if (text.includes('相談')) score += 20;
  if (text.includes('問い合わせ')) score += 20;
  if (text.includes('窓口')) score += 15;

  // 除外ワード（野焼き、ごみ等）
  if (text.includes('野焼き') || text.includes('屋外焼却')) score -= 80;
  if (!text.includes('アスベスト') && !text.includes('石綿')) {
    if (text.includes('ごみ') || text.includes('pm2.5')) score -= 30;
  }

  // URLドメインマッチ
  const cityDomain = getCityDomain(city);
  if (cityDomain && url.includes(cityDomain)) score += 10;

  // /taiki/ パス
  if (url.includes('/taiki/')) score += 5;

  return score;
}

// ヘルパー関数: 最適なURLを選択
function selectBestUrl(citations, city) {
  if (!citations || citations.length === 0) return null;

  // 簡易的にタイトル・スニペットを含めたスコアリング
  // （実際のPerplexity APIは citations に詳細情報を含まない場合があるため、URL文字列のみでスコアリング）
  const scored = citations.map(url => {
    const score = scoreCitationUrl(url, '', '', city);
    return { url, score };
  });

  scored.sort((a, b) => b.score - a.score);

  console.log('📊 URLスコアリング結果（上位3件）:');
  scored.slice(0, 3).forEach(item => {
    console.log(`   Score: ${item.score} | ${item.url}`);
  });

  return scored[0]?.url || null;
}

// ヘルパー関数: URL正規化
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url === 'missing' || url.toLowerCase() === 'missing') return null;

  // 空白除去
  url = url.trim();
  if (url.length === 0) return null;

  // 末尾の記号除去
  url = url.replace(/[)\]>]+$/, '');

  // https:// 補完
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // 形式検証
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}
