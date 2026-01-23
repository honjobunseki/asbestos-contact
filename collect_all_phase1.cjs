/**
 * フェーズ1: 全国自治体の窓口ページ発見
 * 
 * 目的: Perplexity APIで窓口ページURLを発見し、証拠付きでデータベース化
 * 出力: JSON形式の窓口ページリスト（フェーズ2の入力となる）
 */

const axios = require('axios');
const fs = require('fs');

// 全国47都道府県
const PREFECTURES = [
  { name: '北海道', domain: 'pref.hokkaido.lg.jp' },
  { name: '青森県', domain: 'pref.aomori.lg.jp' },
  { name: '岩手県', domain: 'pref.iwate.jp' },
  { name: '宮城県', domain: 'pref.miyagi.jp' },
  { name: '秋田県', domain: 'pref.akita.lg.jp' },
  { name: '山形県', domain: 'pref.yamagata.jp' },
  { name: '福島県', domain: 'pref.fukushima.lg.jp' },
  { name: '茨城県', domain: 'pref.ibaraki.jp' },
  { name: '栃木県', domain: 'pref.tochigi.lg.jp' },
  { name: '群馬県', domain: 'pref.gunma.jp' },
  { name: '埼玉県', domain: 'pref.saitama.lg.jp' },
  { name: '千葉県', domain: 'pref.chiba.lg.jp' },
  { name: '東京都', domain: 'metro.tokyo.lg.jp' },
  { name: '神奈川県', domain: 'pref.kanagawa.jp' },
  { name: '新潟県', domain: 'pref.niigata.lg.jp' },
  { name: '富山県', domain: 'pref.toyama.jp' },
  { name: '石川県', domain: 'pref.ishikawa.lg.jp' },
  { name: '福井県', domain: 'pref.fukui.lg.jp' },
  { name: '山梨県', domain: 'pref.yamanashi.jp' },
  { name: '長野県', domain: 'pref.nagano.lg.jp' },
  { name: '岐阜県', domain: 'pref.gifu.lg.jp' },
  { name: '静岡県', domain: 'pref.shizuoka.jp' },
  { name: '愛知県', domain: 'pref.aichi.jp' },
  { name: '三重県', domain: 'pref.mie.lg.jp' },
  { name: '滋賀県', domain: 'pref.shiga.lg.jp' },
  { name: '京都府', domain: 'pref.kyoto.jp' },
  { name: '大阪府', domain: 'pref.osaka.lg.jp' },
  { name: '兵庫県', domain: 'web.pref.hyogo.lg.jp' },
  { name: '奈良県', domain: 'pref.nara.jp' },
  { name: '和歌山県', domain: 'pref.wakayama.lg.jp' },
  { name: '鳥取県', domain: 'pref.tottori.lg.jp' },
  { name: '島根県', domain: 'pref.shimane.lg.jp' },
  { name: '岡山県', domain: 'pref.okayama.jp' },
  { name: '広島県', domain: 'pref.hiroshima.lg.jp' },
  { name: '山口県', domain: 'pref.yamaguchi.lg.jp' },
  { name: '徳島県', domain: 'pref.tokushima.lg.jp' },
  { name: '香川県', domain: 'pref.kagawa.lg.jp' },
  { name: '愛媛県', domain: 'pref.ehime.jp' },
  { name: '高知県', domain: 'pref.kochi.lg.jp' },
  { name: '福岡県', domain: 'pref.fukuoka.lg.jp' },
  { name: '佐賀県', domain: 'pref.saga.lg.jp' },
  { name: '長崎県', domain: 'pref.nagasaki.jp' },
  { name: '熊本県', domain: 'pref.kumamoto.jp' },
  { name: '大分県', domain: 'pref.oita.jp' },
  { name: '宮崎県', domain: 'pref.miyazaki.lg.jp' },
  { name: '鹿児島県', domain: 'pref.kagoshima.jp' },
  { name: '沖縄県', domain: 'pref.okinawa.jp' }
];

// 政令指定都市 + 主要市
const MAJOR_CITIES = [
  // 政令指定都市
  { name: '札幌市', pref: '北海道', domain: 'city.sapporo.jp' },
  { name: '仙台市', pref: '宮城県', domain: 'city.sendai.jp' },
  { name: 'さいたま市', pref: '埼玉県', domain: 'city.saitama.jp' },
  { name: '千葉市', pref: '千葉県', domain: 'city.chiba.jp' },
  { name: '横浜市', pref: '神奈川県', domain: 'city.yokohama.lg.jp' },
  { name: '川崎市', pref: '神奈川県', domain: 'city.kawasaki.jp' },
  { name: '相模原市', pref: '神奈川県', domain: 'city.sagamihara.kanagawa.jp' },
  { name: '新潟市', pref: '新潟県', domain: 'city.niigata.lg.jp' },
  { name: '静岡市', pref: '静岡県', domain: 'city.shizuoka.lg.jp' },
  { name: '浜松市', pref: '静岡県', domain: 'city.hamamatsu.shizuoka.jp' },
  { name: '名古屋市', pref: '愛知県', domain: 'city.nagoya.jp' },
  { name: '京都市', pref: '京都府', domain: 'city.kyoto.lg.jp' },
  { name: '大阪市', pref: '大阪府', domain: 'city.osaka.lg.jp' },
  { name: '堺市', pref: '大阪府', domain: 'city.sakai.lg.jp' },
  { name: '神戸市', pref: '兵庫県', domain: 'city.kobe.lg.jp' },
  { name: '岡山市', pref: '岡山県', domain: 'city.okayama.jp' },
  { name: '広島市', pref: '広島県', domain: 'city.hiroshima.lg.jp' },
  { name: '北九州市', pref: '福岡県', domain: 'city.kitakyushu.lg.jp' },
  { name: '福岡市', pref: '福岡県', domain: 'city.fukuoka.lg.jp' },
  { name: '熊本市', pref: '熊本県', domain: 'city.kumamoto.jp' },
  
  // その他主要市
  { name: '桐生市', pref: '群馬県', domain: 'city.kiryu.lg.jp' },
  { name: '本庄市', pref: '埼玉県', domain: 'city.honjo.lg.jp' },
  { name: '川越市', pref: '埼玉県', domain: 'city.kawagoe.saitama.jp' },
  { name: '船橋市', pref: '千葉県', domain: 'city.funabashi.lg.jp' },
  { name: '柏市', pref: '千葉県', domain: 'city.kashiwa.lg.jp' },
  { name: '八王子市', pref: '東京都', domain: 'city.hachioji.tokyo.jp' },
  { name: '横須賀市', pref: '神奈川県', domain: 'city.yokosuka.kanagawa.jp' },
  { name: '金沢市', pref: '石川県', domain: 'city.kanazawa.ishikawa.jp' },
  { name: '岐阜市', pref: '岐阜県', domain: 'city.gifu.lg.jp' },
  { name: '豊田市', pref: '愛知県', domain: 'city.toyota.aichi.jp' }
];

const API_KEY = process.env.PERPLEXITY_API_KEY || '';
const RESULTS = [];
let successCount = 0;
let failCount = 0;

async function searchAsbestosContact(municipality) {
  const { name, domain, pref } = municipality;
  const type = pref ? '市' : '都道府県';
  
  console.log(`\n🔍 [${successCount + failCount + 1}/${PREFECTURES.length + MAJOR_CITIES.length}] ${name}`);
  
  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `あなたは自治体の連絡先情報を抽出する専門家です。以下の形式で必ずJSON形式で返してください：

{
  "department": "担当部署名（正式名称）",
  "phone": "電話番号（ハイフン付き）",
  "email": "メールアドレス",
  "page_url": "窓口ページの完全URL",
  "evidence_urls": ["情報の出典URL配列"]
}

見つからない項目はnullとしてください。`
        },
        {
          role: 'user',
          content: `${name}（ドメイン: ${domain}）のアスベスト（石綿）に関する窓口の連絡先を教えてください。

【必須情報】
1. 担当部署名
2. 電話番号
3. メールアドレス
4. 窓口ページURL（最重要）

必ずJSON形式で返してください。`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      search_domain_filter: [domain],
      return_citations: true
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    const content = response.data.choices[0].message.content;
    const citations = response.data.citations || [];
    
    // JSON抽出
    let parsedData = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log(`   ⚠ JSON解析失敗`);
    }
    
    const success = !!parsedData?.page_url;
    
    if (success) {
      successCount++;
      console.log(`   ✅ 成功 (${successCount}件目)`);
      console.log(`   📄 窓口: ${parsedData.page_url}`);
    } else {
      failCount++;
      console.log(`   ❌ 失敗 (${failCount}件目)`);
    }
    
    RESULTS.push({
      municipality: name,
      type: type,
      prefecture: pref || name,
      domain: domain,
      parsed_data: parsedData,
      citations: citations,
      timestamp: new Date().toISOString(),
      success: success
    });
    
  } catch (error) {
    failCount++;
    console.error(`   ❌ エラー: ${error.message}`);
    
    RESULTS.push({
      municipality: name,
      type: type,
      domain: domain,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
  
  // レート制限対策（3秒待機）
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function main() {
  const startTime = Date.now();
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║    フェーズ1: 全国自治体 窓口ページ発見                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`対象: 都道府県 ${PREFECTURES.length}箇所 + 市 ${MAJOR_CITIES.length}箇所`);
  console.log(`合計: ${PREFECTURES.length + MAJOR_CITIES.length}箇所\n`);
  console.log(`予想時間: 約${Math.ceil((PREFECTURES.length + MAJOR_CITIES.length) * 3 / 60)}分\n`);
  
  if (!API_KEY) {
    console.error('❌ エラー: PERPLEXITY_API_KEY が設定されていません');
    process.exit(1);
  }
  
  // 都道府県を検索
  console.log('\n### 都道府県（47箇所） ###\n');
  for (const pref of PREFECTURES) {
    await searchAsbestosContact(pref);
  }
  
  // 主要市を検索
  console.log('\n### 主要市（30箇所） ###\n');
  for (const city of MAJOR_CITIES) {
    await searchAsbestosContact(city);
  }
  
  const endTime = Date.now();
  const duration = Math.ceil((endTime - startTime) / 1000 / 60);
  
  // 結果を保存
  const outputPath = '/tmp/phase1_discovery_results.json';
  fs.writeFileSync(outputPath, JSON.stringify(RESULTS, null, 2));
  
  // サマリー表示
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                   収集完了サマリー                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`総件数: ${RESULTS.length}件`);
  console.log(`成功: ${successCount}件 (${Math.round(successCount/RESULTS.length*100)}%)`);
  console.log(`失敗: ${failCount}件 (${Math.round(failCount/RESULTS.length*100)}%)`);
  console.log(`所要時間: ${duration}分\n`);
  
  // 窓口ページが見つかった自治体のリスト
  const withPageUrl = RESULTS.filter(r => r.parsed_data?.page_url);
  console.log(`窓口ページ発見: ${withPageUrl.length}件\n`);
  
  // メールアドレスが見つかった自治体
  const withEmail = RESULTS.filter(r => r.parsed_data?.email);
  console.log(`メール発見: ${withEmail.length}件\n`);
  
  console.log(`✅ 詳細結果: ${outputPath}\n`);
  
  // CSV形式でもエクスポート
  const csvPath = '/tmp/phase1_discovery_results.csv';
  const csvLines = ['自治体,種別,都道府県,ドメイン,担当部署,電話,メール,窓口URL,成功'];
  
  RESULTS.forEach(r => {
    const row = [
      r.municipality,
      r.type,
      r.prefecture,
      r.domain,
      r.parsed_data?.department || '',
      r.parsed_data?.phone || '',
      r.parsed_data?.email || '',
      r.parsed_data?.page_url || '',
      r.success ? 'OK' : 'NG'
    ].map(v => `"${v}"`).join(',');
    csvLines.push(row);
  });
  
  fs.writeFileSync(csvPath, csvLines.join('\n'));
  console.log(`✅ CSV形式: ${csvPath}\n`);
}

main();
