import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定（API用）
app.use('/api/*', cors())

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>アスベスト通報サイト</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-3xl">
            <!-- ヘッダー -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                    アスベスト通報システム
                </h1>
                <p class="text-gray-600">お住まいの地域のアスベスト情報を通報できます</p>
            </div>

            <!-- メインフォーム -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <form id="asbestosForm">
                    <!-- 2カラムレイアウト -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <!-- 左カラム: 簡単検索 -->
                        <div class="border-r border-gray-200 pr-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-search text-blue-500 mr-2"></i>
                                簡単検索
                            </h3>
                            <div class="mb-4">
                                <label class="block text-gray-700 font-semibold mb-2">
                                    市区町村名を入力
                                </label>
                                <input 
                                    type="text" 
                                    id="citySearchInput"
                                    placeholder="例: 本庄、渋谷、横浜"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                                    autocomplete="off"
                                >
                                <p class="text-sm text-gray-500 mt-1">入力すると候補が表示されます</p>
                                
                                <!-- 候補リスト -->
                                <div id="suggestions" class="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto">
                                    <!-- 候補がここに表示される -->
                                </div>
                            </div>
                        </div>

                        <!-- 右カラム: プルダウン選択 -->
                        <div class="pl-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-list text-green-500 mr-2"></i>
                                プルダウン選択
                            </h3>
                            <div class="mb-4">
                                <label class="block text-gray-700 font-semibold mb-2">
                                    都道府県を選択
                                </label>
                                <select 
                                    id="prefectureSelect"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                                >
                                    <option value="">選択してください</option>
                                    <!-- 都道府県リストはJavaScriptで追加 -->
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="block text-gray-700 font-semibold mb-2">
                                    市区町村を選択
                                </label>
                                <select 
                                    id="citySelect"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                                    disabled
                                >
                                    <option value="">まず都道府県を選択</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- アスベスト情報 -->
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-building text-gray-600 mr-1"></i>
                            建物・場所の情報
                        </label>
                        <input 
                            type="text" 
                            id="location"
                            placeholder="例: 〇〇町1-2-3 △△ビル"
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                        >
                    </div>

                    <!-- 詳細情報 -->
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                            詳細情報
                        </label>
                        <textarea 
                            id="details"
                            rows="4"
                            placeholder="アスベストの状況、気づいた点などを記入してください"
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                        ></textarea>
                    </div>

                    <!-- 送信ボタン -->
                    <button 
                        type="submit"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
                    >
                        <i class="fas fa-search mr-2"></i>
                        問い合わせ先を検索
                    </button>
                </form>

                <!-- 結果表示エリア -->
                <div id="resultArea" class="mt-6 hidden">
                    <div class="border-t-2 border-gray-200 pt-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-phone text-green-500 mr-2"></i>
                            問い合わせ先
                        </h2>
                        <div id="resultContent" class="bg-blue-50 p-4 rounded-lg">
                            <!-- 結果がここに表示される -->
                        </div>
                    </div>
                </div>

                <!-- ローディング表示 -->
                <div id="loading" class="mt-6 hidden text-center">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="text-gray-600 mt-2">検索中...</p>
                </div>
            </div>

            <!-- フッター -->
            <div class="text-center mt-6 text-gray-600 text-sm">
                <p>このサイトは情報提供を目的としています</p>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 全国の都道府県・市区町村データ（主要都市版）
            const citiesData = {
              "北海道": ["札幌市", "函館市", "旭川市"],
              "青森県": ["青森市", "弘前市", "八戸市"],
              "岩手県": ["盛岡市", "宮古市", "一関市"],
              "宮城県": ["仙台市", "石巻市", "多賀城市"],
              "秋田県": ["秋田市", "能代市", "横手市"],
              "山形県": ["山形市", "米沢市", "鶴岡市"],
              "福島県": ["福島市", "会津若松市", "郡山市", "いわき市"],
              "茨城県": ["水戸市", "日立市", "つくば市"],
              "栃木県": ["宇都宮市", "足利市", "栃木市"],
              "群馬県": ["前橋市", "高崎市", "桐生市"],
              "埼玉県": ["さいたま市", "川越市", "熊谷市", "川口市", "所沢市", "本庄市", "春日部市", "草加市", "越谷市", "蕨市", "戸田市"],
              "千葉県": ["千葉市", "市川市", "船橋市", "松戸市", "柏市", "市原市", "流山市", "浦安市"],
              "東京都": ["千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区", "八王子市", "立川市", "武蔵野市", "三鷹市", "府中市", "調布市", "町田市"],
              "神奈川県": ["横浜市", "川崎市", "相模原市", "横須賀市", "平塚市", "鎌倉市", "藤沢市", "小田原市", "茅ヶ崎市", "厚木市", "大和市"],
              "新潟県": ["新潟市", "長岡市", "上越市"],
              "富山県": ["富山市", "高岡市"],
              "石川県": ["金沢市", "小松市"],
              "福井県": ["福井市", "敦賀市"],
              "山梨県": ["甲府市", "富士吉田市"],
              "長野県": ["長野市", "松本市", "上田市", "飯田市", "佐久市"],
              "岐阜県": ["岐阜市", "大垣市", "高山市"],
              "静岡県": ["静岡市", "浜松市", "沼津市", "富士市"],
              "愛知県": ["名古屋市", "豊橋市", "岡崎市", "一宮市", "豊田市", "春日井市", "豊川市"],
              "三重県": ["津市", "四日市市", "伊勢市"],
              "滋賀県": ["大津市", "彦根市", "草津市"],
              "京都府": ["京都市", "宇治市", "亀岡市"],
              "大阪府": ["大阪市", "堺市", "岸和田市", "豊中市", "吹田市", "高槻市", "枚方市", "茨木市", "八尾市", "東大阪市"],
              "兵庫県": ["神戸市", "姫路市", "尼崎市", "明石市", "西宮市", "宝塚市"],
              "奈良県": ["奈良市", "橿原市", "生駒市"],
              "和歌山県": ["和歌山市", "田辺市"],
              "鳥取県": ["鳥取市", "米子市"],
              "島根県": ["松江市", "出雲市"],
              "岡山県": ["岡山市", "倉敷市", "津山市"],
              "広島県": ["広島市", "呉市", "福山市", "東広島市"],
              "山口県": ["下関市", "宇部市", "山口市"],
              "徳島県": ["徳島市", "鳴門市"],
              "香川県": ["高松市", "丸亀市"],
              "愛媛県": ["松山市", "今治市", "新居浜市"],
              "高知県": ["高知市", "南国市"],
              "福岡県": ["北九州市", "福岡市", "久留米市", "飯塚市", "大牟田市", "筑紫野市", "春日市", "大野城市"],
              "佐賀県": ["佐賀市", "唐津市", "鳥栖市"],
              "長崎県": ["長崎市", "佐世保市", "諫早市"],
              "熊本県": ["熊本市", "八代市", "天草市"],
              "大分県": ["大分市", "別府市"],
              "宮崎県": ["宮崎市", "都城市"],
              "鹿児島県": ["鹿児島市", "霧島市"],
              "沖縄県": ["那覇市", "沖縄市", "うるま市"]
            };
            
            // 検索用のフラットなリスト
            const citiesFlatList = [];
            Object.entries(citiesData).forEach(([prefecture, cities]) => {
                cities.forEach(city => {
                    citiesFlatList.push({
                        prefecture,
                        city,
                        fullName: prefecture + city
                    });
                });
            });
            
            const prefectures = Object.keys(citiesData);

            // グローバル変数
            let selectedCity = '';

            // 都道府県セレクトボックスを初期化
            const prefectureSelect = document.getElementById('prefectureSelect');
            prefectures.forEach(pref => {
                const option = document.createElement('option');
                option.value = pref;
                option.textContent = pref;
                prefectureSelect.appendChild(option);
            });

            // 都道府県変更時に市区町村を更新
            prefectureSelect.addEventListener('change', (e) => {
                const prefecture = e.target.value;
                const citySelect = document.getElementById('citySelect');
                
                // 市区町村セレクトをクリア
                citySelect.innerHTML = '<option value="">選択してください</option>';
                citySelect.disabled = !prefecture;
                
                if (prefecture && citiesData[prefecture]) {
                    citiesData[prefecture].forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                }
                
                selectedCity = '';
            });

            // 市区町村選択時
            document.getElementById('citySelect').addEventListener('change', (e) => {
                const prefecture = prefectureSelect.value;
                const city = e.target.value;
                if (prefecture && city) {
                    selectedCity = prefecture + city;
                }
            });

            // インクリメンタルサーチ
            const searchInput = document.getElementById('citySearchInput');
            const suggestionsDiv = document.getElementById('suggestions');
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                if (query.length === 0) {
                    suggestionsDiv.classList.add('hidden');
                    return;
                }
                
                // 候補を検索
                const matches = citiesFlatList.filter(item => 
                    item.city.includes(query) || 
                    item.fullName.includes(query) ||
                    item.prefecture.includes(query)
                ).slice(0, 10); // 最大10件
                
                if (matches.length === 0) {
                    suggestionsDiv.innerHTML = '<div class="p-3 text-gray-500">候補が見つかりませんでした</div>';
                    suggestionsDiv.classList.remove('hidden');
                    return;
                }
                
                // 候補を表示
                suggestionsDiv.innerHTML = matches.map(item => \`
                    <div class="suggestion-item p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                         data-fullname="\${item.fullName}">
                        <span class="text-gray-600">\${item.prefecture}</span>
                        <span class="font-semibold text-gray-800">\${item.city}</span>
                    </div>
                \`).join('');
                
                // 候補クリック時のイベント
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const fullName = item.dataset.fullname;
                        selectedCity = fullName;
                        searchInput.value = fullName;
                        suggestionsDiv.classList.add('hidden');
                        
                        // 自動で検索実行
                        await performSearch();
                    });
                });
                
                suggestionsDiv.classList.remove('hidden');
            });

            // 候補リスト外をクリックしたら閉じる
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                    suggestionsDiv.classList.add('hidden');
                }
            });

            // 検索実行関数
            async function performSearch() {
                const city = selectedCity;
                const location = document.getElementById('location').value;
                const details = document.getElementById('details').value;

                if (!city) {
                    alert('市区町村を選択してください');
                    return;
                }

                // ローディング表示
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('resultArea').classList.add('hidden');

                try {
                    // API呼び出し
                    const response = await axios.post('/api/search', {
                        city: city,
                        location: location,
                        details: details
                    });

                    // 結果表示
                    displayResult(response.data);
                } catch (error) {
                    console.error('Error:', error);
                    alert('検索中にエラーが発生しました');
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            }

            // フォーム送信処理（プルダウン選択時）
            document.getElementById('asbestosForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // プルダウンから選択された場合
                const prefecture = document.getElementById('prefectureSelect').value;
                const city = document.getElementById('citySelect').value;
                if (prefecture && city) {
                    selectedCity = prefecture + city;
                    await performSearch();
                }
            });

            function displayResult(data) {
                const resultContent = document.getElementById('resultContent');
                resultContent.innerHTML = \`
                    <div class="space-y-4">
                        <!-- 注意事項 -->
                        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                            <p class="text-sm text-yellow-800">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                この情報はAIによる自動検索結果です。必ず公式サイトで最新情報をご確認ください。
                            </p>
                        </div>

                        <!-- 担当部署 -->
                        <div>
                            <p class="font-semibold text-gray-700 mb-1">
                                <i class="fas fa-building text-blue-500 mr-1"></i>
                                担当部署
                            </p>
                            <p class="text-gray-800 text-lg">\${data.department || '情報なし'}</p>
                        </div>
                        
                        <!-- 電話番号 -->
                        <div>
                            <p class="font-semibold text-gray-700 mb-1">
                                <i class="fas fa-phone text-green-500 mr-1"></i>
                                電話番号
                            </p>
                            <p class="text-gray-800 text-lg">
                                <a href="tel:\${data.phone}" class="text-blue-600 hover:underline">
                                    \${data.phone || '情報なし'}
                                </a>
                            </p>
                        </div>
                        
                        <!-- メールアドレス -->
                        \${data.email ? \`
                            <div>
                                <p class="font-semibold text-gray-700 mb-1">
                                    <i class="fas fa-envelope text-purple-500 mr-1"></i>
                                    メールアドレス
                                </p>
                                <p class="text-gray-800 text-lg">
                                    <a href="mailto:\${data.email}" class="text-blue-600 hover:underline">
                                        \${data.email}
                                    </a>
                                </p>
                            </div>
                        \` : ''}

                        <!-- 問い合わせフォーム -->
                        \${data.formUrl ? \`
                            <div>
                                <p class="font-semibold text-gray-700 mb-1">
                                    <i class="fas fa-edit text-orange-500 mr-1"></i>
                                    問い合わせフォーム
                                </p>
                                <p class="text-gray-800 text-lg">
                                    <a href="\${data.formUrl}" target="_blank" class="text-blue-600 hover:underline">
                                        \${data.formUrl}
                                    </a>
                                </p>
                            </div>
                        \` : ''}

                        <!-- 区切り線 -->
                        <div class="border-t-2 border-gray-200 my-4"></div>

                        <!-- 公式ページを開くボタン（一番下） -->
                        \${data.pageUrl ? \`
                            <div class="text-center">
                                <a href="\${data.pageUrl}" target="_blank" 
                                   class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 shadow-lg">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    公式ページを開く
                                </a>
                            </div>
                        \` : '<p class="text-center text-gray-600">公式ページが見つかりませんでした</p>'}

                        <!-- AI回答の詳細（オプション） -->
                        \${data.aiResponse ? \`
                            <details class="mt-4">
                                <summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    AI検索結果の詳細を見る
                                </summary>
                                <div class="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                                    \${data.aiResponse}
                                </div>
                            </details>
                        \` : ''}
                    </div>
                \`;
                document.getElementById('resultArea').classList.remove('hidden');
            }
        </script>
    </body>
    </html>
  `)
})

// API: 問い合わせ先検索（Perplexity API使用）
app.post('/api/search', async (c) => {
  try {
    const { city, location, details } = await c.req.json()
    
    if (!city) {
      return c.json({ error: '市町村名を入力してください' }, 400)
    }

    // Perplexity APIキーを取得
    const apiKey = c.env.PERPLEXITY_API_KEY
    
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY is not set')
      return c.json({ 
        error: 'APIキーが設定されていません',
        department: city + ' の環境課・公害対策課',
        phone: '市役所の代表電話にお問い合わせください',
        url: null
      }, 500)
    }

    // Perplexity APIで検索
    const prompt = `${city}のアスベスト（石綿）に関する通報・相談窓口の公式情報を教えてください。

必ず以下の形式で回答してください：
1. 担当部署名: 正式な部署名を記載
2. 電話番号: ハイフン付きで記載（例: 03-1234-5678）
3. メールアドレス: もしあれば記載（例: kankyo@city.example.lg.jp）
4. 問い合わせフォームURL: もしあれば、フォーム専用のURLを記載
5. 公式ページURL: アスベスト関連ページのURL（完全なURL、https://から始まる）

【超重要】URLの記載方法：
- URLには絶対に引用番号を付けないでください（NG例: https://example.com[1]）
- URLには絶対に括弧を付けないでください（NG例: https://example.com）や https://example.com（）
- URLは完全な形式で記載してください（OK例: https://www.city.example.lg.jp/path/to/page.html）
- URLの後に何も付けないでください

その他の重要事項：
- 最新の公式サイトの情報のみを使用してください
- 問い合わせフォームと公式ページは別々に記載してください
- メールアドレスが見つからない場合は「なし」と記載してください`

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',  // より高精度なモデルを使用
        messages: [
          {
            role: 'system',
            content: 'あなたは日本の行政情報に詳しい専門アシスタントです。最新の公式サイトから正確な情報のみを提供してください。URLを記載する際は、引用番号[1][2]や括弧（）を絶対に含めず、完全なURLのみを記載してください。URLは https:// から始まり .html や / で終わる完全な形式で提供してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,  // より確定的な回答を得る
        max_tokens: 800,
        search_domain_filter: ['go.jp', 'lg.jp'],  // 日本の公式ドメインに限定
        return_citations: true  // 引用情報を返す
      })
    })

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`)
    }

    const data = await perplexityResponse.json()
    const aiResponse = data.choices[0].message.content

    // レスポンスから情報を抽出
    const result = parseAIResponse(aiResponse, city)
    
    return c.json(result)
    
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ 
      error: '検索中にエラーが発生しました',
      department: '情報を取得できませんでした',
      phone: '市役所の代表電話にお問い合わせください',
      url: null
    }, 500)
  }
})

// AIレスポンスをパースする関数
function parseAIResponse(response: string, city: string) {
  // URLを抽出して綺麗にする
  const urlMatches = response.match(/https?:\/\/[^\s\)\]\}]+/g) || []
  
  // URLのクリーニング
  const cleanUrls = urlMatches.map(url => {
    // 引用番号や余計な文字を徹底的に削除
    let cleaned = url
      // 引用番号のパターン（あらゆる形式に対応）
      .replace(/\[[0-9]+$/g, '')           // [1 のような末尾
      .replace(/\[[0-9]+\]$/g, '')         // [1] のような末尾
      .replace(/\[[0-9]+\].*$/g, '')       // [1][2]... のような連続
      .replace(/\[.*$/g, '')               // [ 以降を全削除
      // 括弧類
      .replace(/[\)）\]】\}]+$/g, '')      // 末尾の閉じ括弧を削除
      .replace(/（.*$/g, '')               // （以降を削除
      .replace(/\(.*$/g, '')               // (以降を削除
      // 句読点
      .replace(/[、。，\.;；]+$/g, '')     // 末尾の句読点を削除
      // その他の記号
      .replace(/[\s]+$/g, '')              // 末尾の空白を削除
      .replace(/["\'\`]+$/g, '')           // 末尾の引用符を削除
    
    return cleaned
  })
  
  // フォームURLと一般URLを分類
  const formUrls = cleanUrls.filter(url => 
    url.includes('/form') || 
    url.includes('/inquiry') || 
    url.includes('/contact') ||
    url.includes('/otoiawase') ||
    url.includes('form') ||
    url.includes('inquiry')
  )
  
  const generalUrls = cleanUrls.filter(url => 
    !formUrls.includes(url) && 
    (url.includes('city.') || url.includes('pref.') || url.includes('.lg.jp') || url.includes('.go.jp'))
  )
  
  // 最適なフォームURLを選択
  const formUrl = formUrls.sort((a, b) => b.length - a.length)[0] || null
  
  // 最適な一般URLを選択（長いものを優先）
  const pageUrl = generalUrls.sort((a, b) => b.length - a.length)[0] || cleanUrls[0] || null

  // メールアドレスを抽出
  const emailMatches = response.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  const email = emailMatches ? emailMatches[0] : null

  // 電話番号を抽出（日本の電話番号形式）
  const phoneMatches = response.match(/0\d{1,4}-\d{1,4}-\d{4}/g) || 
                       response.match(/0\d{9,10}/g)
  
  let phone = null
  if (phoneMatches) {
    // ハイフン付きを優先
    phone = phoneMatches.find(p => p.includes('-')) || phoneMatches[0]
    // ハイフンがない場合は追加
    if (phone && !phone.includes('-')) {
      // 03-1234-5678 のような形式に変換
      if (phone.startsWith('0')) {
        const areaCode = phone.substring(0, phone.length === 10 ? 3 : 4)
        const rest = phone.substring(areaCode.length)
        const middle = rest.substring(0, 4)
        const last = rest.substring(4)
        phone = `${areaCode}-${middle}-${last}`
      }
    }
  }

  // 部署名を抽出
  let department = null
  const deptPatterns = [
    /部署[名]?[：:]\s*([^\n。、]+)/,
    /担当[部署]*[：:]\s*([^\n。、]+)/,
    /([^\n。、]*(?:環境|公害|建築|都市計画|まちづくり|生活衛生)[^\n。、]*(?:課|部|係|センター|局))/,
  ]
  
  for (const pattern of deptPatterns) {
    const match = response.match(pattern)
    if (match) {
      department = match[1].trim()
      break
    }
  }

  return {
    department: department || `${city} 環境課・公害対策課（要確認）`,
    phone: phone || '市区町村の代表電話にお問い合わせください',
    email: email,
    formUrl: formUrl,
    pageUrl: pageUrl,
    aiResponse: response,
    sources: cleanUrls
  }
}

export default app
