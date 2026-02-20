import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定（API用）
app.use('/api/*', cors())

// 管理画面
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>検索ログ管理 - アスベスト通報システム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-6xl">
            <!-- ヘッダー -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                            検索ログ管理
                        </h1>
                        <p class="text-gray-600">Perplexity API検索の成功/失敗を確認できます</p>
                    </div>
                    <a href="/" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        <i class="fas fa-home mr-2"></i>
                        ホームに戻る
                    </a>
                </div>
            </div>

            <!-- 統計情報 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">総検索数</div>
                    <div id="totalCount" class="text-3xl font-bold text-blue-600">-</div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">成功（手動DB）</div>
                    <div id="manualCount" class="text-3xl font-bold text-green-600">-</div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">成功（API）</div>
                    <div id="apiSuccessCount" class="text-3xl font-bold text-blue-600">-</div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">失敗</div>
                    <div id="failedCount" class="text-3xl font-bold text-red-600">-</div>
                </div>
            </div>

            <!-- フィルター -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex gap-4 items-center flex-wrap">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">フィルター</label>
                        <select id="filterType" class="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                            <option value="all">すべて</option>
                            <option value="manual">手動DB</option>
                            <option value="api-success">API成功</option>
                            <option value="api-failed">API失敗</option>
                            <option value="incomplete">情報不完全（電話/メール/フォームなし）</option>
                        </select>
                    </div>
                    <div class="mt-auto">
                        <button id="clearLogsBtn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-trash mr-2"></i>
                            ログをクリア
                        </button>
                    </div>
                    <div class="mt-auto">
                        <button id="exportBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>
                            JSONエクスポート
                        </button>
                    </div>
                </div>
            </div>

            <!-- ログテーブル -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2"></i>
                    検索ログ一覧
                </h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">市町村名</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ソース</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">フォーム</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">検索日時</th>
                            </tr>
                        </thead>
                        <tbody id="logsTableBody" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                                    ログを読み込み中...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let allLogs = [];

            async function loadLogs() {
                try {
                    const response = await axios.get('/api/search-logs');
                    allLogs = response.data;
                    updateStats();
                    renderLogs();
                } catch (error) {
                    console.error('Error loading logs:', error);
                    alert('ログの読み込みに失敗しました');
                }
            }

            function updateStats() {
                const total = allLogs.length;
                const manual = allLogs.filter(log => log.source === 'manual').length;
                const apiSuccess = allLogs.filter(log => log.source === 'api' && log.success).length;
                const failed = allLogs.filter(log => !log.success).length;

                document.getElementById('totalCount').textContent = total;
                document.getElementById('manualCount').textContent = manual;
                document.getElementById('apiSuccessCount').textContent = apiSuccess;
                document.getElementById('failedCount').textContent = failed;
            }

            function renderLogs() {
                const filterType = document.getElementById('filterType').value;
                let filteredLogs = allLogs;

                // フィルタリング
                if (filterType === 'manual') {
                    filteredLogs = allLogs.filter(log => log.source === 'manual');
                } else if (filterType === 'api-success') {
                    filteredLogs = allLogs.filter(log => log.source === 'api' && log.success);
                } else if (filterType === 'api-failed') {
                    filteredLogs = allLogs.filter(log => !log.success);
                } else if (filterType === 'incomplete') {
                    filteredLogs = allLogs.filter(log => !log.hasPhone || !log.hasEmail || !log.hasFormUrl);
                }

                const tbody = document.getElementById('logsTableBody');
                
                if (filteredLogs.length === 0) {
                    tbody.innerHTML = \`
                        <tr>
                            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                                ログがありません
                            </td>
                        </tr>
                    \`;
                    return;
                }

                tbody.innerHTML = filteredLogs.map(log => \`
                    <tr class="\${!log.success ? 'bg-red-50' : ''}">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">\${log.city}</div>
                            \${log.error ? \`<div class="text-xs text-red-600">\${log.error}</div>\` : ''}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${log.source === 'manual' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                \${log.source === 'manual' ? '手動DB' : 'API'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                \${log.success ? '成功' : '失敗'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            \${log.hasPhone ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-times text-red-600"></i>'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            \${log.hasEmail ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-times text-red-600"></i>'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            \${log.hasFormUrl ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-times text-red-600"></i>'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            \${new Date(log.timestamp).toLocaleString('ja-JP')}
                        </td>
                    </tr>
                \`).join('');
            }

            async function clearLogs() {
                if (!confirm('すべてのログをクリアしますか？')) {
                    return;
                }
                
                try {
                    await axios.delete('/api/search-logs');
                    allLogs = [];
                    updateStats();
                    renderLogs();
                    alert('ログをクリアしました');
                } catch (error) {
                    console.error('Error clearing logs:', error);
                    alert('ログのクリアに失敗しました');
                }
            }

            function exportLogs() {
                const filterType = document.getElementById('filterType').value;
                let filteredLogs = allLogs;

                // フィルタリング（exportボタン用）
                if (filterType === 'api-failed') {
                    filteredLogs = allLogs.filter(log => !log.success);
                } else if (filterType === 'incomplete') {
                    filteredLogs = allLogs.filter(log => !log.hasPhone || !log.hasEmail || !log.hasFormUrl);
                }

                const dataStr = JSON.stringify(filteredLogs, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = \`search-logs-\${new Date().toISOString().split('T')[0]}.json\`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            }

            // イベントリスナー
            document.getElementById('filterType').addEventListener('change', renderLogs);
            document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);
            document.getElementById('exportBtn').addEventListener('click', exportLogs);

            // 初期ロード
            loadLogs();

            // 自動更新（30秒ごと）
            setInterval(loadLogs, 30000);
        </script>
    </body>
    </html>
  `)
})

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
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                            アスベスト通報システム
                        </h1>
                        <p class="text-gray-600">お住まいの地域のアスベスト情報を通報できます</p>
                    </div>
                    <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm">
                        <i class="fas fa-cog mr-2"></i>
                        管理画面
                    </a>
                </div>
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

                    <!-- 問い合わせ内容選択 -->
                    <div class="mt-6 pt-6 border-t border-gray-300">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-question-circle text-orange-500 mr-2"></i>
                            問い合わせ内容
                        </h3>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2">
                                問い合わせの目的を選択してください
                            </label>
                            <select 
                                id="inquiryType"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                            >
                                <option value="">選択してください</option>
                                <option value="survey">事前調査・届出の不正（環境部局）</option>
                                <option value="prevention">飛散防止が不十分（環境部局）</option>
                                <option value="safety">作業員の安全（労働基準監督署）</option>
                                <option value="waste">廃棄物処理の不正（廃棄物部局）</option>
                                <option value="health">健康被害・不安（保健部局／労基署）</option>
                            </select>
                            <p class="text-sm text-gray-500 mt-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                目的に応じて適切な連絡先が表示されます
                            </p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2">
                                問い合わせ内容の詳細（任意）
                            </label>
                            <textarea 
                                id="inquiryDetail"
                                rows="3"
                                placeholder="具体的な問い合わせ内容を入力してください（任意）"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
                            ></textarea>
                        </div>
                    </div>
                </form>

                <!-- 検索履歴タブ -->
                <div id="historyTabs" class="mt-6 hidden">
                    <div class="border-b border-gray-300">
                        <div id="tabButtons" class="flex overflow-x-auto space-x-2 pb-2">
                            <!-- タブボタンがここに表示される -->
                        </div>
                    </div>
                </div>

                <!-- 結果表示エリア -->
                <div id="resultArea" class="mt-6 hidden">
                    <div id="resultContent">
                        <!-- 結果がここに表示される -->
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
            // 全国の都道府県・市区町村データ（完全版）
            const citiesData = {
              "北海道": ["札幌市", "函館市", "小樽市", "旭川市", "室蘭市", "釧路市", "帯広市", "北見市", "夕張市", "岩見沢市"],
              "青森県": ["青森市", "弘前市", "八戸市", "黒石市", "五所川原市", "十和田市", "三沢市", "むつ市"],
              "岩手県": ["盛岡市", "宮古市", "大船渡市", "花巻市", "北上市", "久慈市", "遠野市", "一関市", "陸前高田市"],
              "宮城県": ["仙台市", "石巻市", "塩竈市", "気仙沼市", "白石市", "名取市", "角田市", "多賀城市", "岩沼市"],
              "秋田県": ["秋田市", "能代市", "横手市", "大館市", "男鹿市", "湯沢市", "鹿角市", "由利本荘市"],
              "山形県": ["山形市", "米沢市", "鶴岡市", "酒田市", "新庄市", "寒河江市", "上山市", "村山市", "長井市"],
              "福島県": ["福島市", "会津若松市", "郡山市", "いわき市", "白河市", "須賀川市", "喜多方市", "相馬市"],
              "茨城県": ["水戸市", "日立市", "土浦市", "古河市", "石岡市", "結城市", "龍ケ崎市", "下妻市", "常総市", "つくば市"],
              "栃木県": ["宇都宮市", "足利市", "栃木市", "佐野市", "鹿沼市", "日光市", "小山市", "真岡市", "大田原市"],
              "群馬県": ["前橋市", "高崎市", "桐生市", "伊勢崎市", "太田市", "沼田市", "館林市", "渋川市", "藤岡市"],
              "埼玉県": ["さいたま市", "川越市", "熊谷市", "川口市", "行田市", "秩父市", "所沢市", "飯能市", "加須市", "本庄市", "東松山市", "春日部市", "狭山市", "羽生市", "鴻巣市", "深谷市", "上尾市", "草加市", "越谷市", "蕨市", "戸田市", "入間市", "朝霞市", "志木市", "和光市", "新座市", "桶川市", "久喜市", "北本市", "八潮市", "富士見市", "三郷市", "蓮田市", "坂戸市", "幸手市", "鶴ヶ島市", "日高市", "吉川市", "ふじみ野市", "白岡市"],
              "千葉県": ["千葉市", "銚子市", "市川市", "船橋市", "館山市", "木更津市", "松戸市", "野田市", "茂原市", "成田市", "佐倉市", "東金市", "旭市", "習志野市", "柏市", "勝浦市", "市原市", "流山市", "八千代市", "我孫子市", "鴨川市", "鎌ケ谷市", "君津市", "富津市", "浦安市", "四街道市", "袖ケ浦市", "八街市", "印西市", "白井市", "富里市", "南房総市", "匝瑳市", "香取市", "山武市", "いすみ市", "大網白里市"],
              "東京都": ["千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区", "八王子市", "立川市", "武蔵野市", "三鷹市", "青梅市", "府中市", "昭島市", "調布市", "町田市", "小金井市", "小平市", "日野市", "東村山市", "国分寺市", "国立市", "福生市", "狛江市", "東大和市", "清瀬市", "東久留米市", "武蔵村山市", "多摩市", "稲城市", "羽村市", "あきる野市", "西東京市"],
              "神奈川県": ["横浜市", "川崎市", "相模原市", "横須賀市", "平塚市", "鎌倉市", "藤沢市", "小田原市", "茅ヶ崎市", "逗子市", "三浦市", "秦野市", "厚木市", "大和市", "伊勢原市", "海老名市", "座間市", "南足柄市", "綾瀬市"],
              "新潟県": ["新潟市", "長岡市", "三条市", "柏崎市", "新発田市", "小千谷市", "加茂市", "十日町市", "見附市", "村上市", "燕市", "糸魚川市", "妙高市", "五泉市", "上越市", "阿賀野市", "佐渡市", "魚沼市", "南魚沼市", "胎内市"],
              "富山県": ["富山市", "高岡市", "魚津市", "氷見市", "滑川市", "黒部市", "砺波市", "小矢部市", "南砺市", "射水市"],
              "石川県": ["金沢市", "七尾市", "小松市", "輪島市", "珠洲市", "加賀市", "羽咋市", "かほく市", "白山市", "能美市", "野々市市"],
              "福井県": ["福井市", "敦賀市", "小浜市", "大野市", "勝山市", "鯖江市", "あわら市", "越前市", "坂井市"],
              "山梨県": ["甲府市", "富士吉田市", "都留市", "山梨市", "大月市", "韮崎市", "南アルプス市", "北杜市", "甲斐市", "笛吹市", "上野原市", "甲州市", "中央市"],
              "長野県": ["長野市", "松本市", "上田市", "岡谷市", "飯田市", "諏訪市", "須坂市", "小諸市", "伊那市", "駒ヶ根市", "中野市", "大町市", "飯山市", "茅野市", "塩尻市", "佐久市", "千曲市", "東御市", "安曇野市"],
              "岐阜県": ["岐阜市", "大垣市", "高山市", "多治見市", "関市", "中津川市", "美濃市", "瑞浪市", "羽島市", "恵那市", "美濃加茂市", "土岐市", "各務原市", "可児市", "山県市", "瑞穂市", "飛騨市", "本巣市", "郡上市", "下呂市", "海津市"],
              "静岡県": ["静岡市", "浜松市", "沼津市", "熱海市", "三島市", "富士宮市", "伊東市", "島田市", "富士市", "磐田市", "焼津市", "掛川市", "藤枝市", "御殿場市", "袋井市", "下田市", "裾野市", "湖西市", "伊豆市", "御前崎市", "菊川市", "伊豆の国市", "牧之原市"],
              "愛知県": ["名古屋市", "豊橋市", "岡崎市", "一宮市", "瀬戸市", "半田市", "春日井市", "豊川市", "津島市", "碧南市", "刈谷市", "豊田市", "安城市", "西尾市", "蒲郡市", "犬山市", "常滑市", "江南市", "小牧市", "稲沢市", "新城市", "東海市", "大府市", "知多市", "知立市", "尾張旭市", "高浜市", "岩倉市", "豊明市", "日進市", "田原市", "愛西市", "清須市", "北名古屋市", "弥富市", "みよし市", "あま市", "長久手市"],
              "三重県": ["津市", "四日市市", "伊勢市", "松阪市", "桑名市", "鈴鹿市", "名張市", "尾鷲市", "亀山市", "鳥羽市", "熊野市", "いなべ市", "志摩市", "伊賀市"],
              "滋賀県": ["大津市", "彦根市", "長浜市", "近江八幡市", "草津市", "守山市", "栗東市", "甲賀市", "野洲市", "湖南市", "高島市", "東近江市", "米原市"],
              "京都府": ["京都市", "福知山市", "舞鶴市", "綾部市", "宇治市", "宮津市", "亀岡市", "城陽市", "向日市", "長岡京市", "八幡市", "京田辺市", "京丹後市", "南丹市", "木津川市"],
              "大阪府": ["大阪市", "堺市", "岸和田市", "豊中市", "池田市", "吹田市", "泉大津市", "高槻市", "貝塚市", "守口市", "枚方市", "茨木市", "八尾市", "泉佐野市", "富田林市", "寝屋川市", "河内長野市", "松原市", "大東市", "和泉市", "箕面市", "柏原市", "羽曳野市", "門真市", "摂津市", "高石市", "藤井寺市", "東大阪市", "泉南市", "四條畷市", "交野市", "大阪狭山市", "阪南市"],
              "兵庫県": ["神戸市", "姫路市", "尼崎市", "明石市", "西宮市", "洲本市", "芦屋市", "伊丹市", "相生市", "豊岡市", "加古川市", "赤穂市", "西脇市", "宝塚市", "三木市", "高砂市", "川西市", "小野市", "三田市", "加西市", "丹波篠山市", "養父市", "丹波市", "南あわじ市", "朝来市", "淡路市", "宍粟市", "加東市", "たつの市"],
              "奈良県": ["奈良市", "大和高田市", "大和郡山市", "天理市", "橿原市", "桜井市", "五條市", "御所市", "生駒市", "香芝市", "葛城市", "宇陀市"],
              "和歌山県": ["和歌山市", "海南市", "橋本市", "有田市", "御坊市", "田辺市", "新宮市", "紀の川市", "岩出市"],
              "鳥取県": ["鳥取市", "米子市", "倉吉市", "境港市"],
              "島根県": ["松江市", "浜田市", "出雲市", "益田市", "大田市", "安来市", "江津市", "雲南市"],
              "岡山県": ["岡山市", "倉敷市", "津山市", "玉野市", "笠岡市", "井原市", "総社市", "高梁市", "新見市", "備前市", "瀬戸内市", "赤磐市", "真庭市", "美作市", "浅口市"],
              "広島県": ["広島市", "呉市", "竹原市", "三原市", "尾道市", "福山市", "府中市", "三次市", "庄原市", "大竹市", "東広島市", "廿日市市", "安芸高田市", "江田島市"],
              "山口県": ["下関市", "宇部市", "山口市", "萩市", "防府市", "下松市", "岩国市", "光市", "長門市", "柳井市", "美祢市", "周南市", "山陽小野田市"],
              "徳島県": ["徳島市", "鳴門市", "小松島市", "阿南市", "吉野川市", "阿波市", "美馬市", "三好市"],
              "香川県": ["高松市", "丸亀市", "坂出市", "善通寺市", "観音寺市", "さぬき市", "東かがわ市", "三豊市"],
              "愛媛県": ["松山市", "今治市", "宇和島市", "八幡浜市", "新居浜市", "西条市", "大洲市", "伊予市", "四国中央市", "西予市", "東温市"],
              "高知県": ["高知市", "室戸市", "安芸市", "南国市", "土佐市", "須崎市", "宿毛市", "土佐清水市", "四万十市", "香南市", "香美市"],
              "福岡県": ["北九州市", "福岡市", "大牟田市", "久留米市", "直方市", "飯塚市", "田川市", "柳川市", "八女市", "筑後市", "大川市", "行橋市", "豊前市", "中間市", "小郡市", "筑紫野市", "春日市", "大野城市", "宗像市", "太宰府市", "古賀市", "福津市", "うきは市", "宮若市", "嘉麻市", "朝倉市", "みやま市", "糸島市", "那珂川市"],
              "佐賀県": ["佐賀市", "唐津市", "鳥栖市", "多久市", "伊万里市", "武雄市", "鹿島市", "小城市", "嬉野市", "神埼市"],
              "長崎県": ["長崎市", "佐世保市", "島原市", "諫早市", "大村市", "平戸市", "松浦市", "対馬市", "壱岐市", "五島市", "西海市", "雲仙市", "南島原市"],
              "熊本県": ["熊本市", "八代市", "人吉市", "荒尾市", "水俣市", "玉名市", "山鹿市", "菊池市", "宇土市", "上天草市", "宇城市", "阿蘇市", "天草市", "合志市"],
              "大分県": ["大分市", "別府市", "中津市", "日田市", "佐伯市", "臼杵市", "津久見市", "竹田市", "豊後高田市", "杵築市", "宇佐市", "豊後大野市", "由布市", "国東市"],
              "宮崎県": ["宮崎市", "都城市", "延岡市", "日南市", "小林市", "日向市", "串間市", "西都市", "えびの市"],
              "鹿児島県": ["鹿児島市", "鹿屋市", "枕崎市", "阿久根市", "出水市", "指宿市", "西之表市", "垂水市", "薩摩川内市", "日置市", "曽於市", "霧島市", "いちき串木野市", "南さつま市", "志布志市", "奄美市", "南九州市", "伊佐市", "姶良市"],
              "沖縄県": ["那覇市", "宜野湾市", "石垣市", "浦添市", "名護市", "糸満市", "沖縄市", "豊見城市", "うるま市", "宮古島市", "南城市"]
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
            let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            let currentActiveTab = null;

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
                    // 最初に都道府県オプションを追加
                    const prefOption = document.createElement('option');
                    prefOption.value = '都道府県';
                    prefOption.textContent = prefecture;
                    citySelect.appendChild(prefOption);
                    
                    // 市区町村リストを追加
                    citiesData[prefecture].forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                }
                
                selectedCity = '';
            });

            // 市区町村選択時（自動検索）
            document.getElementById('citySelect').addEventListener('change', async (e) => {
                const prefecture = prefectureSelect.value;
                const city = e.target.value;
                if (prefecture && city) {
                    // 「都道府県」が選択された場合は都道府県名のみ
                    selectedCity = (city === '都道府県') ? prefecture : (prefecture + city);
                    await performSearch();
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
                
                // 都道府県名での検索
                const prefectureMatches = prefectures.filter(pref => 
                    pref.includes(query)
                ).map(pref => ({
                    prefecture: pref,
                    city: '',
                    fullName: pref,
                    isPrefecture: true
                }));
                
                // 市区町村での検索
                const cityMatches = citiesFlatList.filter(item => 
                    item.city.includes(query) || 
                    item.fullName.includes(query) ||
                    item.prefecture.includes(query)
                );
                
                // 都道府県全域を最初に、その後に市区町村
                const matches = [...prefectureMatches, ...cityMatches].slice(0, 10);
                
                if (matches.length === 0) {
                    suggestionsDiv.innerHTML = '<div class="p-3 text-gray-500">候補が見つかりませんでした</div>';
                    suggestionsDiv.classList.remove('hidden');
                    return;
                }
                
                // 候補を表示
                suggestionsDiv.innerHTML = matches.map(item => \`
                    <div class="suggestion-item p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 \${item.isPrefecture ? 'bg-green-50' : ''}"
                         data-fullname="\${item.fullName}">
                        <span class="font-semibold text-gray-800">\${item.isPrefecture ? item.prefecture : item.prefecture + ' ' + item.city}</span>
                        \${item.isPrefecture ? '<span class="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">都道府県</span>' : ''}
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
                const inquiryType = document.getElementById('inquiryType').value;

                if (!city) {
                    alert('市区町村を選択してください');
                    return;
                }

                // ローディング表示
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('resultArea').classList.add('hidden');
                document.getElementById('historyTabs').classList.add('hidden');

                try {
                    // API呼び出し
                    const response = await axios.post('/api/search', {
                        city: city,
                        inquiryType: inquiryType || ''
                    });

                    // 検索履歴に追加
                    addToHistory(city, response.data);
                    
                    // 結果表示
                    displayResult(response.data, city);
                    
                    // タブを表示
                    renderTabs();
                } catch (error) {
                    console.error('Error:', error);
                    
                    // 404エラー（データが見つからない）の場合は、エラーレスポンスを表示
                    if (error.response && error.response.status === 404 && error.response.data) {
                        // 検索履歴に追加
                        addToHistory(city, error.response.data);
                        
                        // 結果表示（データが見つからない場合の表示）
                        displayResult(error.response.data, city);
                        
                        // タブを表示
                        renderTabs();
                    } else {
                        // その他のエラーの場合のみアラート表示
                        alert('検索中にエラーが発生しました');
                    }
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            }

            // 検索履歴に追加（最大5件）
            function addToHistory(city, data) {
                // 都道府県のみの検索かどうかを判定
                const isPrefectureOnly = city.match(/^.+?(都|道|府|県)$/);
                
                // 市町村名のみを抽出（都道府県のみの場合はそのまま）
                const cityNameOnly = isPrefectureOnly ? city : city.replace(/^.+?(都|道|府|県)/, '');
                
                // 既存の同じ市区町村を削除
                searchHistory = searchHistory.filter(item => item.city !== city);
                
                // 先頭に追加
                searchHistory.unshift({
                    city: city,
                    cityNameOnly: cityNameOnly,
                    data: data,
                    timestamp: Date.now()
                });
                
                // 最大5件に制限
                if (searchHistory.length > 5) {
                    searchHistory = searchHistory.slice(0, 5);
                }
                
                // localStorageに保存
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                
                // 最新のタブをアクティブに
                currentActiveTab = city;
            }

            // タブを描画
            function renderTabs() {
                const tabButtons = document.getElementById('tabButtons');
                const historyTabs = document.getElementById('historyTabs');
                const resultArea = document.getElementById('resultArea');
                
                if (searchHistory.length === 0) {
                    historyTabs.classList.add('hidden');
                    resultArea.classList.add('hidden');
                    return;
                }
                
                historyTabs.classList.remove('hidden');
                
                tabButtons.innerHTML = searchHistory.map(item => {
                    const isActive = item.city === currentActiveTab;
                    return \`
                        <div class="relative inline-block">
                            <button 
                                class="tab-button px-4 py-2 pr-8 rounded-t-lg font-semibold transition whitespace-nowrap \${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                                data-city="\${item.city}"
                            >
                                \${item.cityNameOnly}
                            </button>
                            <button 
                                class="delete-tab-button absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full \${isActive ? 'bg-white text-blue-600 hover:bg-gray-100' : 'bg-gray-400 text-white hover:bg-gray-500'} flex items-center justify-center text-xs font-bold transition"
                                data-city="\${item.city}"
                                title="削除"
                            >
                                ×
                            </button>
                        </div>
                    \`;
                }).join('');
                
                // タブクリックイベント
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.addEventListener('click', () => {
                        const city = button.dataset.city;
                        const historyItem = searchHistory.find(item => item.city === city);
                        if (historyItem) {
                            currentActiveTab = city;
                            displayResult(historyItem.data, city);
                            renderTabs();
                        }
                    });
                });
                
                // 削除ボタンクリックイベント
                document.querySelectorAll('.delete-tab-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // タブクリックイベントを防ぐ
                        const city = button.dataset.city;
                        deleteFromHistory(city);
                    });
                });
            }
            
            // 履歴から削除
            function deleteFromHistory(city) {
                // 履歴から削除
                searchHistory = searchHistory.filter(item => item.city !== city);
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                
                // 削除したタブがアクティブだった場合
                if (currentActiveTab === city) {
                    if (searchHistory.length > 0) {
                        // 最初のタブをアクティブに
                        currentActiveTab = searchHistory[0].city;
                        displayResult(searchHistory[0].data, searchHistory[0].city);
                    } else {
                        // 履歴が空の場合
                        currentActiveTab = null;
                        document.getElementById('resultArea').classList.add('hidden');
                    }
                }
                
                // タブを再描画
                renderTabs();
            }

            // ページ読み込み時に履歴タブを表示
            if (searchHistory.length > 0) {
                currentActiveTab = searchHistory[0].city;
                displayResult(searchHistory[0].data, searchHistory[0].city);
                renderTabs();
            }

            function displayResult(data, city) {
                const resultContent = document.getElementById('resultContent');
                
                // 都道府県のみの検索かどうかを判定
                const isPrefectureOnly = city.match(/^.+?(都|道|府|県)$/);
                
                // 市町村名のみを抽出（都道府県名を除く）、都道府県のみの場合はそのまま
                const cityNameOnly = isPrefectureOnly ? city : city.replace(/^.+?(都|道|府|県)/, '');
                
                // エラー処理
                if (data.error) {
                    resultContent.innerHTML = \`
                        <div class="text-center bg-red-50 p-8 rounded-lg border-2 border-red-300">
                            <h2 class="text-xl font-bold text-red-800 mb-4">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                情報が見つかりませんでした
                            </h2>
                            <p class="text-gray-700 mb-4">\${data.error}</p>
                            <a href="https://www.google.com/search?q=\${encodeURIComponent(city + ' アスベスト 相談')}" 
                               target="_blank" 
                               class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
                                <i class="fab fa-google mr-2"></i>
                                Googleで検索
                            </a>
                        </div>
                    \`;
                    document.getElementById('resultArea').classList.remove('hidden');
                    return;
                }
                
                // 新形式（departments配列）の処理
                if (data.departments && data.departments.length > 0) {
                    const departmentsHTML = data.departments.map(dept => \`
                        <div class="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-md">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-building text-blue-600 mr-2"></i>
                                \${dept.category}
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <span class="text-sm font-semibold text-gray-600">担当部署:</span>
                                    <p class="text-gray-800">\${dept.name}</p>
                                </div>
                                \${dept.phone ? \`
                                    <div>
                                        <span class="text-sm font-semibold text-gray-600">📞 電話番号:</span>
                                        <div class="text-gray-800 whitespace-pre-line">\${dept.phone.split('\\n').map(line => 
                                            \`<div class="my-1"><a href="tel:\${line.replace(/[^0-9-]/g, '')}" class="text-blue-600 hover:underline">\${line}</a></div>\`
                                        ).join('')}</div>
                                    </div>
                                \` : ''}
                                \${dept.email ? \`
                                    <div>
                                        <span class="text-sm font-semibold text-gray-600">📧 メール:</span>
                                        <p><a href="mailto:\${dept.email}" class="text-blue-600 hover:underline">\${dept.email}</a></p>
                                    </div>
                                \` : ''}
                                \${dept.formUrl ? \`
                                    <div>
                                        <a href="\${dept.formUrl}" target="_blank" 
                                           class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
                                            <i class="fas fa-envelope mr-2"></i>
                                            問い合わせフォーム
                                        </a>
                                    </div>
                                \` : ''}
                            </div>
                        </div>
                    \`).join('');
                    
                    resultContent.innerHTML = \`
                        <div class="space-y-6">
                            \${data.pageUrl ? \`
                                <div class="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-300">
                                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                                        <i class="fas fa-external-link-alt text-blue-600 mr-2"></i>
                                        \${cityNameOnly}のアスベスト相談窓口
                                    </h2>
                                    <p class="text-gray-700 mb-6">
                                        以下のボタンから公式ページにアクセスして、最新の情報をご確認ください
                                    </p>
                                    <a href="\${data.pageUrl}" target="_blank" 
                                       class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg transition transform hover:scale-105 shadow-lg text-lg">
                                        <i class="fas fa-external-link-alt mr-2"></i>
                                        公式ページを開く
                                    </a>
                                </div>
                            \` : ''}
                            \${departmentsHTML}
                        </div>
                    \`;
                    document.getElementById('resultArea').classList.remove('hidden');
                    return;
                }
                
                // 旧形式（department, phone等）の処理（後方互換性）
                resultContent.innerHTML = \`
                    <div class="space-y-6">
                        \${data.pageUrl ? \`
                            <div class="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-300">
                                <h2 class="text-2xl font-bold text-gray-800 mb-4">
                                    <i class="fas fa-external-link-alt text-blue-600 mr-2"></i>
                                    \${cityNameOnly}のアスベスト相談窓口
                                </h2>
                                <a href="\${data.pageUrl}" target="_blank" 
                                   class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg transition transform hover:scale-105 shadow-lg text-lg">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    公式ページを開く
                                </a>
                            </div>
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

// 手動データベース（発見フェーズで収集したデータ - 74件）
const manualDatabase: Record<string, any> = {
  "北海道": {
    "department": "北海道環境生活部環境保全局循環型社会推進課",
    "phone": "011-231-4111",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.hokkaido.lg.jp/ks/jss/khz/contents/asbest/madoguchi/dou.html"
  },
  "青森県": {
    "department": "環境エネルギー部 環境政策課 生活環境保全グループ",
    "phone": "017-734-9485",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.aomori.lg.jp/soshiki/kankyo/kankyo/asbestos_soudan.html"
  },
  "岩手県": {
    "department": "環境生活部 環境保全課 環境調整担当",
    "phone": "019-629-5359",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.iwate.jp/kurashikankyou/kankyou/hozen/taiki/1053170.html"
  },
  "宮城県": {
    "department": "保健福祉部健康推進課 健康推進第二班",
    "phone": "022-211-2624",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.miyagi.jp/site/asbestos/asbestos-soudan.html"
  },
  "秋田県": {
    "department": "生活環境部 環境管理課",
    "phone": "018-860-1603",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.akita.lg.jp/pages/archive/1168"
  },
  "山形県": {
    "department": "村山総合支庁環境課",
    "phone": "023-621-8429",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.yamagata.jp/050014/kurashi/kankyo/taiki/asbestos.html"
  },
  "福島県": {
    "department": "水・大気環境課",
    "phone": "024-521-7261",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.fukushima.lg.jp/sec/16035c/mizutaiki-asubesuto.html"
  },
  "茨城県": {
    "department": "茨城県県民生活環境部環境対策課",
    "phone": "029-301-2956",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.ibaraki.jp/seikatsukankyo/kantai/taiki/environment/asbestos.html"
  },
  "栃木県": {
    "department": "環境保全課 大気環境担当",
    "phone": "028-623-3188",
    "email": "kankyo@pref.tochigi.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.tochigi.lg.jp/d03/eco/kankyou/hozen/asbestos.html"
  },
  "群馬県": {
    "department": "感染症・疾病対策課疾病対策係",
    "phone": "027-226-2601",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.gunma.jp/page/1697.html"
  },
  "埼玉県": {
    "department": "県環境部大気環境課",
    "phone": "048-830-3058",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.saitama.lg.jp/a0504/sekimen-soudanmadoguchi1.html"
  },
  "千葉県": {
    "department": "環境生活部 環境保全課",
    "phone": "043-222-2111",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.chiba.lg.jp/kankyo/asbestos/index.html"
  },
  "東京都": {
    "department": "環境局 環境改善部 大気保全課 大気担当",
    "phone": "03-5388-3493",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.kankyo1.metro.tokyo.lg.jp/about/contact_list/air.html"
  },
  "神奈川県": {
    "department": "環境農政局 環境部 環境課 大気・交通環境グループ",
    "phone": "045-210-4111",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.kanagawa.jp/docs/pf7/asubesuto/soudan.html"
  },
  "新潟県": {
    "department": "環境局 環境対策課 大気環境係",
    "phone": null,
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.niigata.lg.jp/sec/kankyotaisaku/1206378086891.html"
  },
  "富山県": {
    "department": "生活環境文化部環境保全課",
    "phone": "076-444-3144",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.toyama.jp/1706/kurashi/kankyoushizen/kankyou/kj0000039347.html"
  },
  "石川県": {
    "department": "生活環境部環境政策課",
    "phone": "076-225-1463",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.ishikawa.lg.jp/kankyo/kankeihourei/ishiwata/ishiwata.html"
  },
  "福井県": {
    "department": "環境政策課",
    "phone": "0776-20-0301",
    "email": "kankyou@pref.fukui.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.fukui.lg.jp/doc/kankyou/asb-ref.html"
  },
  "山梨県": {
    "department": "山梨県森林環境部大気水質保全課",
    "phone": "055-223-1508",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.yamanashi.jp/taiki-sui/74886012357.html"
  },
  "長野県": {
    "department": "環境部水大気環境課",
    "phone": null,
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.nagano.lg.jp/mizutaiki/kurashi/shizen/taiki/asbestos/torikumi/sodan.html"
  },
  "岐阜県": {
    "department": "環境管理課（大気環境係）",
    "phone": "058-272-8232",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.gifu.lg.jp/page/16798.html"
  },
  "静岡県": {
    "department": "くらし・環境部環境局生活環境課",
    "phone": "054-221-2253",
    "email": "seikan@pref.shizuoka.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.shizuoka.jp/kurashikankyo/kankyo/taikisuishitsu/1002100/1002639/1017911.html"
  },
  "愛知県": {
    "department": "愛知県 環境局 環境政策部 水大気環境課",
    "phone": "052-954-6215",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.aichi.jp/soshiki/mizutaiki/0000061151.html"
  },
  "三重県": {
    "department": "三重県 環境生活部 環境共生局 大気・水環境課 大気環境班",
    "phone": "059-224-2380",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.mie.lg.jp/eco/earth/11131014642.htm"
  },
  "滋賀県": {
    "department": "琵琶湖環境部環境政策課環境管理",
    "phone": null,
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.shiga.lg.jp/ippan/kankyoshizen/kankyou/300764.html"
  },
  "京都府": {
    "department": "総合政策環境部環境管理課",
    "phone": "075-414-4709",
    "email": "kankyoka@pref.kyoto.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.kyoto.jp/taiki/asubesutosho.html"
  },
  "大阪府": {
    "department": "環境農林水産部 環境管理室 事業所指導課 大気指導グループ",
    "phone": "06-6210-9581",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.osaka.lg.jp/o120080/jigyoshoshido/asbestos/toiawasesaki.html"
  },
  "兵庫県": {
    "department": "兵庫県環境部 水大気課 大気班",
    "phone": "078-362-3285",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://web.pref.hyogo.lg.jp/org/mizutaiki/index.html"
  },
  "奈良県": {
    "department": "県土マネジメント部 まちづくり推進局 建築安全課",
    "phone": "0742-27-7563",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.nara.jp/3940.htm"
  },
  "和歌山県": {
    "department": "環境生活部環境政策局環境管理課企画指導班",
    "phone": "073-441-2688",
    "email": "e0321001@pref.wakayama.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.wakayama.lg.jp/prefg/032100/d00202043.html"
  },
  "鳥取県": {
    "department": null,
    "phone": null,
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.tottori.lg.jp/item/97070.htm"
  },
  "島根県": {
    "department": "環境政策課",
    "phone": "0852-22-5277",
    "email": "kankyo@pref.shimane.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.shimane.lg.jp/infra/kankyo/kankyo/asbest/"
  },
  "岡山県": {
    "department": "岡山県生活環境部環境管理課",
    "phone": "086-226-7302",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.okayama.jp/page/detail-59801.html"
  },
  "広島県": {
    "department": "環境県民局環境保全課化学物質対策グループ",
    "phone": "082-513-2920",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.hiroshima.lg.jp/site/eco/a-topics-asbesto-tettei-index.html"
  },
  "山口県": {
    "department": "土木建築部住宅課民間住宅支援班",
    "phone": "083-933-3883",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.yamaguchi.lg.jp/soshiki/135/24214.html"
  },
  "徳島県": {
    "department": "生活環境部環境管理課",
    "phone": "088-621-2274",
    "email": "kankyoukanrika@pref.tokushima.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.tokushima.lg.jp/sp/ippannokata/kurashi/shizen/2009090400354/"
  },
  "香川県": {
    "department": "環境管理課",
    "phone": "087-832-3219",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.kagawa.lg.jp/kankyokanri/kankyo-hozen/taikiseikatu/kisei/sb1kw8190816102850.html"
  },
  "愛媛県": {
    "department": "県民環境部環境局環境・ゼロカーボン推進課",
    "phone": "089-912-2347",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.ehime.jp/page/7776.html"
  },
  "高知県": {
    "department": "高知県 林業振興・環境部 環境対策課",
    "phone": "088-821-4524",
    "email": "030801@ken.pref.kochi.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.kochi.lg.jp/doc/asubest-index/"
  },
  "福岡県": {
    "department": "環境部 環境保全課 大気係",
    "phone": "092-643-3360",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.fukuoka.lg.jp/contents/asbesutos-soudanmadoguti.html"
  },
  "佐賀県": {
    "department": "佐賀県県土整備部建築住宅課（建築指導担当）",
    "phone": "0952-25-7165",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.saga.lg.jp/kiji00334289/index.html"
  },
  "長崎県": {
    "department": "長崎県県民生活環境部地域環境課",
    "phone": "095-895-2356",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.nagasaki.jp/bunrui/kurashi-kankyo/kankyohozen-ondankataisaku/ishiwata/"
  },
  "熊本県": {
    "department": "環境生活部 環境局 環境保全課",
    "phone": "096-333-2268",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.kumamoto.jp/soshiki/51/5676.html"
  },
  "大分県": {
    "department": "大分県生活環境部環境保全課",
    "phone": "097-506-3114",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.oita.jp/soshiki/13350/asubesuto-soudan.html"
  },
  "宮崎県": {
    "department": "宮崎県県土整備部建築住宅課",
    "phone": "0985-26-7194",
    "email": "kenchikujutaku@pref.miyazaki.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.pref.miyazaki.lg.jp/kenchikujutaku/kurashi/shakaikiban/yutori-net/asbestos/index.html"
  },
  "鹿児島県": {
    "department": "環境林務部環境保全課",
    "phone": "099-286-2627",
    "email": "cancan@pref.kagoshima.lg.jp",
    "formUrl": null,
    "pageUrl": "http://www.pref.kagoshima.jp/ad05/kurashi-kankyo/kankyo/taikisouon/asbestos/link.html"
  },
  "沖縄県": {
    "department": "沖縄県 環境部 環境保全課",
    "phone": "098-866-2236",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.pref.okinawa.jp/kurashikankyo/kankyo/1018635/1004502/1004510/1004511.html"
  },
  "札幌市": {
    "department": "札幌市環境局環境都市推進部環境対策課",
    "phone": "011-211-2882",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.sapporo.jp/kankyo/taiki_osen/kisei/asbesto/madoguchi.html"
  },
  "仙台市": {
    "department": "環境局 環境対策課",
    "phone": "022-398-4894",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.sendai.jp/taiki/kurashi/machi/kankyohozen/kogai/ishiwata/sodan.html"
  },
  "さいたま市": {
    "department": "環境対策課",
    "phone": "048-829-1111",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.saitama.jp/006/015/029/001/p007104.html"
  },
  "千葉市": {
    "department": "保健福祉局医療衛生部保健所環境衛生課",
    "phone": "043-238-9940",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.chiba.jp/hokenfukushi/iryoeisei/hokenjo/kankyo/asubesuto.html"
  },
  "横浜市": {
    "department": "みどり環境局環境保全部大気・音環境課",
    "phone": "045-671-3843",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/kankyohozen/hozentorikumi/asbesto/sodan-tel.html"
  },
  "川崎市": {
    "department": "川崎市環境局環境対策部環境対策推進課",
    "phone": "044-200-2526",
    "email": "30suisin@city.kawasaki.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.kawasaki.jp/kurashi/category/29-1-4-5-6-0-0-0-0-0.html"
  },
  "相模原市": {
    "department": "環境保全課",
    "phone": "042-769-8241",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.sagamihara.kanagawa.jp/shisei/1026875/faq/gomi/1002569.html"
  },
  "新潟市": {
    "department": "新潟市環境部環境対策課",
    "phone": "025-226-1367",
    "email": "kankyo@city.niigata.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.niigata.lg.jp/kurashi/kankyo/hozen/seikatukankyo/taikikankyo/asbesto_top/asbestos.html"
  },
  "静岡市": {
    "department": "環境局環境保全課",
    "phone": "054-221-1358",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.shizuoka.lg.jp/s5382/s004072.html"
  },
  "浜松市": {
    "department": "浜松市役所健康福祉部保健所 保健総務課",
    "phone": "053-453-6126",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.hamamatsu.shizuoka.jp/hokenk/soudan/asbestos/top01.html"
  },
  "名古屋市": {
    "department": "環境局 地域環境対策部 大気環境対策課",
    "phone": "052-972-2674",
    "email": "a2674@kankyokyoku.city.nagoya.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.nagoya.jp/kurashi/kankyou/1034811/1012656/1012661.html"
  },
  "京都市": {
    "department": "保健福祉局 医療衛生推進室 医療衛生企画課 健康危機対策担当",
    "phone": "075-222-3600",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.kyoto.lg.jp/hokenfukushi/page/0000222461.html"
  },
  "大阪市": {
    "department": "環境局環境管理部環境規制課環境保全対策グループ",
    "phone": "06-6615-7923",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.osaka.lg.jp/kankyo/page/0000006080.html"
  },
  "堺市": {
    "department": "環境局 環境保全部 環境対策課",
    "phone": "072-228-7474",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.sakai.lg.jp/kurashi/gomi/kankyo_hozen/asbest/toiawase.html"
  },
  "神戸市": {
    "department": "各区保健福祉課保健事業・高齢福祉担当",
    "phone": null,
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.kobe.lg.jp/a00685/bosai/health/asbestos/asube/index.html"
  },
  "岡山市": {
    "department": "環境局環境部環境保全課 大気騒音係",
    "phone": "086-803-1280",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.okayama.jp/kurashi/0000034215.html"
  },
  "広島市": {
    "department": "環境局 環境保全課 大気騒音係",
    "phone": "082-504-2187",
    "email": "kafu@city.hiroshima.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.hiroshima.lg.jp/business/gomi-kankyo/1006007/1026630/1026632/1003146.html"
  },
  "北九州市": {
    "department": "保健福祉局保健所保健企画課",
    "phone": "093-522-5721",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.kitakyushu.lg.jp/contents/924_10687.html"
  },
  "福岡市": {
    "department": "環境局 環境監理部 環境保全課",
    "phone": "092-733-5386",
    "email": null,
    "formUrl": null,
    "pageUrl": "http://www.city.fukuoka.lg.jp/kankyo/k-hozen/qa/FAQ2569.html"
  },
  "熊本市": {
    "department": "健康福祉局 保健衛生部 医療対策課",
    "phone": "096-364-3186",
    "email": "iryoutaisaku@city.kumamoto.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.kumamoto.jp/kiji00328581/index.html"
  },
  "桐生市": {
    "department": "都市整備部 建築指導課",
    "phone": "0277-48-9032",
    "email": "shido@city.kiryu.lg.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.kiryu.lg.jp/kurashi/jutaku/1018099/1001141.html"
  },
  "本庄市": {
    "department": "経済環境部環境推進課環境衛生係",
    "phone": "0495-25-1172",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.honjo.lg.jp/soshiki/keizaikankyo/kankyosuishin/tantoujouhou/gomi/12193.html"
  },
  "川越市": {
    "department": "環境部 環境対策課 大気・騒音担当",
    "phone": "049-224-5894",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.kawagoe.saitama.jp/shisei/toshikei/1010932/1010935.html"
  },
  "柏市": {
    "department": "柏市環境政策課",
    "phone": "04-7167-1695",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://faq2.city.kashiwa.lg.jp/faq/show/587?category_id=38&return_path=%2Fcategory%2Fshow%2F38%3Fpage%3D2%26site_domain%3Ddefault%26sort%3Dsort_access%26sort_order%3Ddesc%26type%3Dshow&site_domain=default"
  },
  "横須賀市": {
    "department": "民生局健康部保健所保健予防課",
    "phone": "046-822-4385",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.yokosuka.kanagawa.jp/3170/asbest/asbestsoudan.html"
  },
  "岐阜市": {
    "department": "まちづくり推進部 建築指導課 耐震係",
    "phone": "058-265-3904",
    "email": "k-shidou@city.gifu.gifu.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.gifu.lg.jp/kurashi/seikatukankyo/1002905/1002909.html"
  },
  "豊田市": {
    "department": "環境部 環境保全課",
    "phone": "0565-34-6628",
    "email": "k_hozen@city.toyota.aichi.jp",
    "formUrl": null,
    "pageUrl": "https://www.city.toyota.aichi.jp/jigyousha/tetsuzuki/kankyouhozen/1027101/index.html"
  },
  "つくば市": {
    "department": "保健部 健康増進課",
    "phone": "029-883-1111",
    "email": null,
    "formUrl": null,
    "pageUrl": "https://www.city.tsukuba.lg.jp/shisetsu/kenko/1001530.html"
  }
}

// 検索ログを保存する簡易的なメモリストア（実運用ではDBを使用）
const searchLogs: Array<{
  city: string
  timestamp: string
  success: boolean
  source: 'manual' | 'api'
  hasPhone: boolean
  hasEmail: boolean
  hasFormUrl: boolean
  error?: string
}> = []

// JSON形式のAI応答をパース
function parseJSONResponse(aiResponse: string, city: string) {
  try {
    // コードブロックを除去
    let jsonStr = aiResponse.trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    const data = JSON.parse(jsonStr)
    const departments: Array<{
      category: string
      name: string
      phone: string | null
      email: string | null
      formUrl: string | null
    }> = []
    
    // recommendedを抽出
    if (data.recommended && data.recommended.department) {
      departments.push({
        category: data.recommended.category || '相談窓口',
        name: data.recommended.department,
        phone: data.recommended.phone || null,
        email: data.recommended.email || null,
        formUrl: data.recommended.inquiry_form_url || null
      })
    }
    
    // candidatesも抽出（最大5件）
    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates.slice(0, 5)) {
        if (candidate.department) {
          departments.push({
            category: candidate.category || '相談窓口',
            name: candidate.department,
            phone: candidate.phone || null,
            email: candidate.email || null,
            formUrl: candidate.inquiry_form_url || null
          })
        }
      }
    }
    
    // pageUrlを抽出
    const pageUrl = data.recommended?.url || null
    
    return { departments, pageUrl }
  } catch (error) {
    console.error('JSON parse error:', error)
    console.log('Response:', aiResponse)
    // フォールバック：従来の方法で解析
    return { 
      departments: parseAIResponse(aiResponse, city), 
      pageUrl: null 
    }
  }
}

// AIの応答をパースして部署情報を抽出（従来形式のフォールバック）
function parseAIResponse(aiResponse: string, city: string) {
  const departments: Array<{
    category: string
    name: string
    phone: string | null
    email: string | null
    formUrl: string | null
  }> = []

  // 各ブロックを分割（空行で区切られている）
  const blocks = aiResponse.split(/\n\s*\n/)
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    let category = ''
    let name = ''
    let phone = null
    let email = null
    let formUrl = null
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // カテゴリー
      if (trimmedLine.match(/^(?:カテゴリー|種別|区分)[:：]/)) {
        category = trimmedLine.replace(/^(?:カテゴリー|種別|区分)[:：]\s*/, '').trim()
      }
      
      // 部署名
      if (trimmedLine.match(/^(?:部署名|担当部署|窓口)[:：]/)) {
        name = trimmedLine.replace(/^(?:部署名|担当部署|窓口)[:：]\s*/, '').trim()
        // 余計な説明を削除
        name = name.replace(/\s*[-ー－]\s*.+$/, '').trim()
        name = name.replace(/\s*（.+?）\s*$/, '').trim()
      }
      
      // 電話番号
      if (trimmedLine.match(/^(?:電話番号|TEL|電話)[:：]/)) {
        phone = trimmedLine.replace(/^(?:電話番号|TEL|電話)[:：]\s*/, '').trim()
        phone = phone.replace(/なし/gi, '').trim() || null
      }
      
      // メールアドレス
      if (trimmedLine.match(/^(?:メールアドレス|メール|Email|E-mail)[:：]/)) {
        email = trimmedLine.replace(/^(?:メールアドレス|メール|Email|E-mail)[:：]\s*/, '').trim()
        email = email.replace(/なし/gi, '').trim() || null
      }
      
      // 問い合わせフォーム
      if (trimmedLine.match(/^(?:問い合わせフォーム|フォーム|お問い合わせ)[:：]/)) {
        formUrl = trimmedLine.replace(/^(?:問い合わせフォーム|フォーム|お問い合わせ)[:：]\s*/, '').trim()
        const urlMatch = formUrl.match(/https?:\/\/[^\s]+/)
        formUrl = urlMatch ? urlMatch[0].replace(/[,.)]+$/, '') : null
      }
    }
    
    // 部署名と電話番号がある場合のみ追加
    if (name && (phone || email || formUrl)) {
      departments.push({
        category: category || '相談窓口',
        name,
        phone,
        email,
        formUrl
      })
    }
  }
  
  return departments
}

// 区役所の情報をマージ（同じカテゴリーの区をまとめる）
function mergeWardDepartments(departments: Array<{
  category: string
  name: string
  phone: string | null
  email: string | null
  formUrl: string | null
}>) {
  // マージせずそのまま返す（各区を個別表示）
  return departments
}

// API: 検索ログを取得
app.get('/api/search-logs', (c) => {
  return c.json(searchLogs)
})

// API: 検索ログをクリア
app.delete('/api/search-logs', (c) => {
  searchLogs.length = 0
  return c.json({ message: 'ログをクリアしました' })
})

// API: 問い合わせ先検索（Perplexity APIでリアルタイム検索）
app.post('/api/search', async (c) => {
  const { city, inquiryType } = await c.req.json()
  
  try {
    if (!city) {
      return c.json({ error: '市町村名を入力してください' }, 400)
    }
    
    // Perplexity APIキーを取得（デバッグ情報追加）
    const apiKey = c.env?.PERPLEXITY_API_KEY
    
    console.log('Environment check:', {
      hasEnv: !!c.env,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'undefined'
    })
    
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY is not set')
      return c.json({ 
        error: 'APIキーが設定されていません。Cloudflareの環境変数（Settings > Environment variables）でPERPLEXITY_API_KEYを設定し、Production環境を選択してから再デプロイしてください。',
        department: city + ' の環境課・公害対策課',
        phone: '市役所の代表電話にお問い合わせください',
        pageUrl: null
      }, 404)
    }

    // Perplexity APIで検索（構造化JSON形式で取得）
    const prompt = `あなたは「日本の自治体のアスベスト（石綿）通報・相談窓口」情報を、公式ソースから抽出し、機械処理しやすいJSONとして返すデータ抽出エージェントです。
${city}について、担当窓口の電話番号・メールアドレス等を調査し、必ずJSONのみで出力してください（説明文は禁止）。

【入力】
- municipality: ${city}
- intent_type: 相談

【最重要ルール（必ず守る）】
1) 推測・想像・補完は禁止。ページに明記がない項目は missing に入れる。
2) 公式ソース優先。原則として自治体公式ドメイン（lg.jp / city.*.jp / town.*.jp / village.*.jp / pref.*.jp 等）から抽出する。
3) 公式が見つからない場合のみ、都道府県の案内ページまたは公的機関（環境省等）を「フォールバック候補」として採用し、flags に記録する。
4) 抽出した値は必ず「根拠URL(url)」と「根拠抜粋(evidence_snippet)」をセットで返す。
5) 候補が複数ある場合は candidates に複数入れ、recommended を1つ選び、reason に選定理由を書く。
6) 代表番号しかない／メールがフォームのみ等、情報の確度が落ちる場合は flags に理由を入れる。

【検索・選定の手順（必須）】
A) まず ${city} の公式サイト内で以下の語を使って探す（サイト内/公式ドメイン優先）
   - **窓口ページを優先**: "問い合わせ" "連絡先" "窓口" "担当課" "相談窓口"
   - 次に: "石綿" "アスベスト" "相談" "通報"
B) 公式ページが複数ある場合、以下の優先順位で候補化する
   1. 「石綿（アスベスト）相談窓口」と明示されたページ
   2. 「建築物の解体等に伴う石綿」関連の担当課ページ
   3. 「環境」「生活環境」「廃棄物」「公害」「建築指導」等の担当課ページ
   4. どうしても無い場合：都道府県の石綿相談窓口ページ
C) 非公式サイト（ブログ、まとめ、地図、求人、広告、PDF転載、民間サイト等）は recommended に採用しない

【抽出する項目】
- department: 担当課・係の名称
- phone: 電話番号（直通があれば直通。無ければ代表。内線表記があれば extension に）
- email: メールアドレス（無い場合は空。フォームのみなら inquiry_form_url に）
- inquiry_form_url: 問い合わせフォームURL
- hours: 受付時間
- address: 所在地
- notes: 条件・注意事項
- category: "相談" / "通報" / "届出" / "その他"

【担当部署の抽出ルール追加（必須）】
- 「担当部署」というラベルが無くても、以下の語の直後/周辺にある課・係名を department として抽出してよい：
  - 担当課 / 担当 / 所管 / 窓口 / 問い合わせ / 連絡先 / 担当窓口 / ○○課 / ○○室 / ○○係 / ○○センター
- department は次の形式を優先して確定する：
  1) 「○○課」「○○室」「○○係」等の組織名
  2) 「○○部 ○○課」など階層が書かれていればそれを含める
  3) 部署名が取れない場合のみ missing に入れる（推測は禁止）
- 連絡先（電話/メール/フォーム）が無いページは窓口ページとして不採用とし、次候補を優先して recommended を決める

【missingの記録ルール】
- missing には必ず理由を付ける：
  { "field": "department", "reason": "ページに部署名が明記されていない" }
- flags には状況を入れる：
  - "no_department_label" （部署名ラベルなし）
  - "contact_info_in_pdf_or_image" （PDF・画像内の情報）
  - "page_has_no_contact_section" （連絡先セクションなし）
  - "fetch_failed" （取得失敗）
  - "fallback_to_prefecture" （都道府県窓口へフォールバック）

【正規化ルール（必須）】
- 電話番号：半角＋ハイフン形式に統一（例：024-123-4567）
- 全角英数・全角ハイフン・全角スペースは半角へ
- "TEL:" "電話：" "代表：" 等のラベルは除去して番号のみ返す
- メール："（アット）" "＠" は "@" に統一

【出力形式】※JSONのみ（前後に説明文・箇条書き・コードブロック禁止）
{
  "municipality": "${city}",
  "intent_type": "相談",
  "recommended": {
    "department": "",
    "category": "",
    "phone": "",
    "extension": "",
    "email": "",
    "inquiry_form_url": "",
    "hours": "",
    "address": "",
    "url": "",
    "evidence_snippet": "",
    "notes": ""
  },
  "candidates": [],
  "missing": [
    { "field": "department", "reason": "ページに部署名が明記されていない" }
  ],
  "flags": [],
  "reason": "",
  "last_checked": "${new Date().toISOString().split('T')[0]}"
}`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'あなたは日本の自治体公式サイトからアスベスト窓口情報を抽出する専門エージェントです。必ず公式ドメイン（.lg.jp等）から情報を取得し、構造化されたJSONのみを出力してください。説明文・補足・コードブロックは一切禁止です。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        search_domain_filter: ['lg.jp', 'go.jp', 'pref.kanagawa.jp', 'city.yokohama.lg.jp', 'city.kawasaki.jp', 'city.fujisawa.kanagawa.jp', 'city.miura.kanagawa.jp', 'city.isehara.kanagawa.jp', 'city.minamiashigara.kanagawa.jp'],
        search_recency_filter: 'year',
        return_citations: true
      })
    })

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`)
    }

    const data = await perplexityResponse.json()
    const aiResponse = data.choices[0].message.content

    console.log(`🔍 Perplexity API検索: ${city}`)
    console.log(`📝 AI応答:\n${aiResponse}`)
    
    // デバッグ：Perplexityの完全なレスポンスをログ
    console.log(`🔧 Perplexity完全レスポンス:`, JSON.stringify(data, null, 2))
    console.log(`📊 Citations数: ${data.citations?.length || 0}`)
    if (data.citations && data.citations.length > 0) {
      console.log(`📎 Citations:`, data.citations.map((c: any) => c.url || c).join(', '))
    }

    // JSON応答を解析
    const { departments: parsedDepartments, pageUrl: extractedUrl } = parseJSONResponse(aiResponse, city)
    
    // 区役所の情報をマージせず個別表示
    const mergedDepartments = mergeWardDepartments(parsedDepartments)
    
    console.log(`📊 抽出された部署数: ${mergedDepartments.length}`)

    // URLを抽出（JSON内のURLを優先、無ければ従来の方法）
    let pageUrl = extractedUrl
    if (!pageUrl) {
      const urlMatch = aiResponse.match(/(?:公式ページURL|URL|url)[:：]\s*(https?:\/\/[^\s\),"]+)/i);
      pageUrl = urlMatch ? urlMatch[1].replace(/[,.)]+$/, '') : null;
    }

    console.log(`📄 検出されたURL: ${pageUrl}`)
    
    // ログを記録
    searchLogs.push({
      city,
      timestamp: new Date().toISOString(),
      success: mergedDepartments.length > 0,
      source: 'api',
      hasPhone: mergedDepartments.some(d => d.phone),
      hasEmail: mergedDepartments.some(d => d.email),
      hasFormUrl: mergedDepartments.some(d => d.formUrl)
    })
    
    if (mergedDepartments.length > 0) {
      return c.json({
        departments: mergedDepartments,
        pageUrl: pageUrl
      })
    } else {
      return c.json({
        error: '窓口情報が見つかりませんでした',
        department: `${city} の環境課`,
        phone: '市役所の代表電話にお問い合わせください',
        pageUrl: pageUrl
      }, 404)
    }
    
  } catch (error) {
    console.error('Search error:', error)
    
    // エラーログを記録
    searchLogs.push({
      city,
      timestamp: new Date().toISOString(),
      success: false,
      source: 'manual',
      hasPhone: false,
      hasEmail: false,
      hasFormUrl: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    })
    
    // より詳細なエラーメッセージ
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    
    return c.json({ 
      error: `検索中にエラーが発生しました: ${errorMessage}`,
      department: '情報を取得できませんでした',
      phone: '市役所の代表電話にお問い合わせください',
      email: null,
      formUrl: null,
      pageUrl: null
    }, 500)
  }
})

/* 
===========================================
Perplexity API関連のコード（バックグラウンド保管）
===========================================

将来的にAPI検索機能を再度有効にする場合は、以下のコードを使用してください。

// 問い合わせタイプに応じた対象部局を決定
function getTargetDepartments(inquiryType: string): string[] {
  const departmentMap: Record<string, string[]> = {
    'survey': ['環境部局'],
    'prevention': ['環境部局'],
    'safety': ['労働基準監督署'],
    'waste': ['廃棄物部局'],
    'health': ['保健部局', '労働基準監督署']
  }
  return departmentMap[inquiryType] || ['環境部局']
}

// Perplexity APIのプロンプトやparseAIResponse関数など、
// 約300行のコードがここに保存されていました。
// 必要に応じて、Gitの履歴から復元できます。

===========================================
*/

export default app
