const fs = require('fs');

// 収集したデータを読み込む
const collectedData = JSON.parse(fs.readFileSync('/tmp/phase1_discovery_results.json', 'utf-8'));

// 手動データベース形式に変換
const manualDatabase = {};

collectedData.forEach(item => {
  if (item.success && item.parsed_data) {
    const key = item.municipality;
    const data = item.parsed_data;
    
    // 手動データベース形式に変換
    manualDatabase[key] = {
      department: data.department || null,
      phone: data.phone || null,
      email: data.email || null,
      formUrl: data.form_url || null,
      pageUrl: data.page_url || null
    };
  }
});

console.log(`✅ 変換完了: ${Object.keys(manualDatabase).length}件のデータ`);

// TypeScript形式で出力
const output = `// 手動データベース（発見フェーズで収集したデータ）
const manualDatabase: Record<string, any> = ${JSON.stringify(manualDatabase, null, 2)};

export default manualDatabase;
`;

fs.writeFileSync('/home/user/webapp/manual_database.ts', output);
console.log(`✅ 出力完了: /home/user/webapp/manual_database.ts`);

// 統計情報を表示
let phoneCount = 0;
let emailCount = 0;
let formUrlCount = 0;
let pageUrlCount = 0;

Object.values(manualDatabase).forEach(item => {
  if (item.phone) phoneCount++;
  if (item.email) emailCount++;
  if (item.formUrl) formUrlCount++;
  if (item.pageUrl) pageUrlCount++;
});

console.log('\n📊 データ統計:');
console.log(`- 総データ数: ${Object.keys(manualDatabase).length}`);
console.log(`- 電話番号あり: ${phoneCount}`);
console.log(`- メールアドレスあり: ${emailCount}`);
console.log(`- 問い合わせフォームあり: ${formUrlCount}`);
console.log(`- 公式ページURLあり: ${pageUrlCount}`);

// サンプル表示
console.log('\n📋 サンプルデータ（最初の3件）:');
Object.entries(manualDatabase).slice(0, 3).forEach(([key, value]) => {
  console.log(`\n${key}:`);
  console.log(JSON.stringify(value, null, 2));
});
