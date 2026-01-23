/**
 * 少数自治体でのテスト実行（5箇所）
 */

const axios = require('axios');
const fs = require('fs');

// テスト対象（既知のフォームがある自治体を含む）
const TEST_MUNICIPALITIES = [
  { name: '北海道', domain: 'pref.hokkaido.lg.jp', type: '都道府県' },
  { name: '群馬県桐生市', domain: 'city.kiryu.lg.jp', type: '市', prefecture: '群馬県' },
  { name: '神奈川県横浜市', domain: 'city.yokohama.lg.jp', type: '市', prefecture: '神奈川県' },
  { name: '埼玉県さいたま市', domain: 'city.saitama.jp', type: '市', prefecture: '埼玉県' },
  { name: '東京都', domain: 'metro.tokyo.lg.jp', type: '都道府県' }
];

const API_KEY = process.env.PERPLEXITY_API_KEY || '';
const RESULTS = [];

async function searchAsbestosContact(municipality) {
  const { name, domain, type, prefecture } = municipality;
  
  console.log(`\n🔍 [${type}] ${name} を検索中...`);
  console.log(`   ドメイン: ${domain}`);
  
  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `あなたは自治体の連絡先情報を抽出する専門家です。以下の形式で必ず JSON として返してください：

{
  "department": "担当部署名（正式名称）",
  "phone": "電話番号（ハイフン付き、例: 011-204-5196）",
  "email": "メールアドレス（例: xxx@city.xxx.lg.jp）",
  "form_url": "問い合わせフォームの完全URL",
  "page_url": "窓口ページの完全URL",
  "evidence_urls": ["情報の出典URL配列"]
}

【重要な探し方】
- ページを必ず最下部までスクロールして確認
- "このページに関するお問い合わせ" セクションを探す
- フォームURLは /inquiry/, /form/, /contact/, /cgi-bin/contacts/ などのパターン
- 見つからない項目は null とする
- URLは必ず完全な形（https://から始まる、クエリパラメータ含む）で記載`
        },
        {
          role: 'user',
          content: `${name}（ドメイン: ${domain}）のアスベスト（石綿）に関する窓口の連絡先を教えてください。

【必須情報】
1. 担当部署名
2. 電話番号
3. メールアドレス
4. 問い合わせフォームURL（最優先）
5. 窓口ページURL

【例】
北海道の場合: ページ最下部に「お問い合わせフォーム」リンクがあり、https://www.pref.hokkaido.lg.jp/inquiry/?group=96&page=12399 がフォームURL
桐生市の場合: ページ最下部に「専用フォームをご利用ください」とあり、https://www.city.kiryu.lg.jp/cgi-bin/contacts/g18700 がフォームURL`
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      search_domain_filter: [domain],
      return_citations: true
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const content = response.data.choices[0].message.content;
    const citations = response.data.citations || [];
    
    console.log(`✅ 応答取得成功`);
    console.log(`   応答長: ${content.length}文字`);
    console.log(`   引用数: ${citations.length}件`);
    
    // JSON抽出を試みる
    let parsedData = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log(`   ✓ JSON解析成功`);
        
        // フォームURL確認
        if (parsedData.form_url) {
          console.log(`   ✓ フォームURL発見: ${parsedData.form_url}`);
        } else {
          console.log(`   ⚠ フォームURL未検出`);
        }
      }
    } catch (e) {
      console.log(`   ⚠ JSON解析失敗、生テキストを保存`);
    }
    
    // 結果を保存
    RESULTS.push({
      municipality: name,
      type: type,
      prefecture: prefecture || name,
      domain: domain,
      ai_response: content,
      parsed_data: parsedData,
      citations: citations,
      timestamp: new Date().toISOString(),
      success: !!parsedData
    });
    
  } catch (error) {
    console.error(`❌ エラー: ${name}`);
    console.error(`   メッセージ: ${error.message}`);
    
    RESULTS.push({
      municipality: name,
      type: type,
      domain: domain,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
  
  // レート制限対策
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function main() {
  console.log('=== アスベスト連絡先収集テスト ===\n');
  console.log(`テスト対象: ${TEST_MUNICIPALITIES.length}箇所\n`);
  
  if (!API_KEY) {
    console.error('❌ エラー: PERPLEXITY_API_KEY が設定されていません');
    console.error('   環境変数を設定してください: export PERPLEXITY_API_KEY=your_key');
    process.exit(1);
  }
  
  for (const municipality of TEST_MUNICIPALITIES) {
    await searchAsbestosContact(municipality);
  }
  
  // 結果を保存
  const outputPath = '/tmp/test_collection_results.json';
  fs.writeFileSync(outputPath, JSON.stringify(RESULTS, null, 2));
  
  // サマリー表示
  console.log('\n\n=== 📊 収集結果サマリー ===\n');
  
  const successCount = RESULTS.filter(r => r.success).length;
  const formFoundCount = RESULTS.filter(r => r.parsed_data?.form_url).length;
  
  console.log(`総件数: ${RESULTS.length}件`);
  console.log(`成功: ${successCount}件`);
  console.log(`フォーム検出: ${formFoundCount}件\n`);
  
  RESULTS.forEach((r, i) => {
    console.log(`${i + 1}. ${r.municipality}`);
    console.log(`   成功: ${r.success ? '✅' : '❌'}`);
    if (r.parsed_data) {
      console.log(`   部署: ${r.parsed_data.department || '未検出'}`);
      console.log(`   電話: ${r.parsed_data.phone || '未検出'}`);
      console.log(`   メール: ${r.parsed_data.email || '未検出'}`);
      console.log(`   フォーム: ${r.parsed_data.form_url ? '✓' : '✗'}`);
    }
    console.log('');
  });
  
  console.log(`\n✅ 詳細結果を保存しました: ${outputPath}`);
}

main();
