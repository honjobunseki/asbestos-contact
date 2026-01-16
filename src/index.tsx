import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

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
                    <!-- 市町村選択 -->
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-map-marker-alt text-red-500 mr-1"></i>
                            市町村を選択してください
                        </label>
                        <input 
                            type="text" 
                            id="cityInput"
                            placeholder="例: 東京都渋谷区"
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                            list="cityList"
                        >
                        <datalist id="cityList">
                            <!-- 市町村リストはJavaScriptで追加 -->
                        </datalist>
                        <p class="text-sm text-gray-500 mt-1">都道府県と市町村名を入力してください</p>
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
            // 市町村データ（サンプル - 後で拡張）
            const cities = [
                '北海道札幌市', '北海道函館市', '北海道旭川市',
                '青森県青森市', '青森県八戸市',
                '東京都千代田区', '東京都中央区', '東京都港区', '東京都新宿区', '東京都文京区',
                '東京都台東区', '東京都墨田区', '東京都江東区', '東京都品川区', '東京都目黒区',
                '東京都大田区', '東京都世田谷区', '東京都渋谷区', '東京都中野区', '東京都杉並区',
                '神奈川県横浜市', '神奈川県川崎市', '神奈川県相模原市',
                '大阪府大阪市', '大阪府堺市', '大阪府豊中市',
                '愛知県名古屋市', '愛知県豊田市',
                '福岡県福岡市', '福岡県北九州市'
            ];

            // datalistに市町村を追加
            const datalist = document.getElementById('cityList');
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                datalist.appendChild(option);
            });

            // フォーム送信処理
            document.getElementById('asbestosForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const city = document.getElementById('cityInput').value;
                const location = document.getElementById('location').value;
                const details = document.getElementById('details').value;

                if (!city) {
                    alert('市町村を入力してください');
                    return;
                }

                // ローディング表示
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('resultArea').classList.add('hidden');

                try {
                    // API呼び出し（後で実装）
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
            });

            function displayResult(data) {
                const resultContent = document.getElementById('resultContent');
                resultContent.innerHTML = \`
                    <div class="space-y-3">
                        <div>
                            <p class="font-semibold text-gray-700">担当部署:</p>
                            <p class="text-gray-800">\${data.department || '情報なし'}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-700">電話番号:</p>
                            <p class="text-gray-800">\${data.phone || '情報なし'}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-700">問い合わせフォーム:</p>
                            \${data.url ? \`
                                <a href="\${data.url}" target="_blank" 
                                   class="inline-block mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    問い合わせページを開く
                                </a>
                            \` : '<p class="text-gray-800">情報なし</p>'}
                        </div>
                    </div>
                \`;
                document.getElementById('resultArea').classList.remove('hidden');
            }
        </script>
    </body>
    </html>
  `)
})

// API: 問い合わせ先検索（仮実装）
app.post('/api/search', async (c) => {
  const { city, location, details } = await c.req.json()
  
  // 仮のレスポンス（後でAI APIと連携）
  return c.json({
    department: city + ' 環境課',
    phone: '03-1234-5678',
    url: 'https://example.com/contact'
  })
})

export default app
