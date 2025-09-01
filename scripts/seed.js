const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDBに接続
const MONGODB_URI = process.env.MONGODB_URI;

// スキーマ定義
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  image: String,
  role: { type: String, enum: ["admin", "manager", "member"], default: "member" },
  department: { type: String, default: "" },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const PairSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cadence: { type: String, enum: ["weekly", "biweekly", "monthly"], default: "biweekly" },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
  pairId: { type: mongoose.Schema.Types.ObjectId, ref: "Pair", required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ["scheduled", "completed", "canceled"], default: "scheduled" },
  agenda: { type: String, default: "" },
  notesShared: { type: String, default: "" },
  notesPrivate: { type: String, default: "" },
  tags: [{ type: String }],
}, { timestamps: true });

// モデル作成
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Pair = mongoose.models.Pair || mongoose.model("Pair", PairSchema);
const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);

// サンプルユーザーデータ
const sampleUsers = [
  // 管理者
  { name: "田中 太郎", email: "tanaka@example.com", role: "admin", department: "人事部", image: "https://i.pravatar.cc/150?img=1" },
  
  // マネージャー
  { name: "佐藤 花子", email: "sato@example.com", role: "manager", department: "開発部", image: "https://i.pravatar.cc/150?img=5" },
  { name: "鈴木 一郎", email: "suzuki@example.com", role: "manager", department: "営業部", image: "https://i.pravatar.cc/150?img=3" },
  { name: "高橋 美咲", email: "takahashi@example.com", role: "manager", department: "マーケティング部", image: "https://i.pravatar.cc/150?img=9" },
  
  // メンバー（開発部）
  { name: "山田 健太", email: "yamada@example.com", role: "member", department: "開発部", image: "https://i.pravatar.cc/150?img=11" },
  { name: "伊藤 さくら", email: "ito@example.com", role: "member", department: "開発部", image: "https://i.pravatar.cc/150?img=16" },
  { name: "渡辺 大輔", email: "watanabe@example.com", role: "member", department: "開発部", image: "https://i.pravatar.cc/150?img=12" },
  { name: "中村 愛", email: "nakamura@example.com", role: "member", department: "開発部", image: "https://i.pravatar.cc/150?img=20" },
  
  // メンバー（営業部）
  { name: "小林 翔", email: "kobayashi@example.com", role: "member", department: "営業部", image: "https://i.pravatar.cc/150?img=13" },
  { name: "加藤 由美", email: "kato@example.com", role: "member", department: "営業部", image: "https://i.pravatar.cc/150?img=21" },
  { name: "吉田 健", email: "yoshida@example.com", role: "member", department: "営業部", image: "https://i.pravatar.cc/150?img=14" },
  
  // メンバー（マーケティング部）
  { name: "山口 真理", email: "yamaguchi@example.com", role: "member", department: "マーケティング部", image: "https://i.pravatar.cc/150?img=23" },
  { name: "松本 拓也", email: "matsumoto@example.com", role: "member", department: "マーケティング部", image: "https://i.pravatar.cc/150?img=15" },
  { name: "井上 彩香", email: "inoue@example.com", role: "member", department: "マーケティング部", image: "https://i.pravatar.cc/150?img=25" },
];

async function seed() {
  try {
    // MongoDB接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');

    // 既存データをクリア
    await User.deleteMany({});
    await Pair.deleteMany({});
    await Session.deleteMany({});
    console.log('既存データをクリア');

    // ユーザーを作成
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`${createdUsers.length}人のユーザーを作成`);

    // ユーザーを取得
    const managers = createdUsers.filter(u => u.role === 'manager');
    const members = createdUsers.filter(u => u.role === 'member');

    // 部署ごとにペアを作成
    const pairs = [];
    for (const manager of managers) {
      const deptMembers = members.filter(m => m.department === manager.department);
      for (const member of deptMembers) {
        // 上司を設定
        await User.findByIdAndUpdate(member._id, { reportsTo: manager._id });
        
        // ペアを作成
        const pair = await Pair.create({
          managerId: manager._id,
          memberId: member._id,
          cadence: ['weekly', 'biweekly', 'monthly'][Math.floor(Math.random() * 3)],
          active: true
        });
        pairs.push(pair);
      }
    }
    console.log(`${pairs.length}個のペアを作成`);

    // サンプルセッションを作成
    const sessions = [];
    const now = new Date();
    
    for (const pair of pairs) {
      // 過去のセッション（完了済み）
      for (let i = 1; i <= 3; i++) {
        const pastDate = new Date(now);
        pastDate.setDate(pastDate.getDate() - (i * 14)); // 2週間ごと
        
        const session = await Session.create({
          pairId: pair._id,
          scheduledAt: pastDate,
          status: 'completed',
          agenda: ['キャリア相談', '業務進捗確認', 'スキル開発', 'チーム課題'][Math.floor(Math.random() * 4)],
          notesShared: '良い議論ができました。次回までの課題も明確になりました。',
          notesPrivate: 'メンバーの成長が見られる。継続的にサポートが必要。',
          tags: ['進捗確認', 'キャリア']
        });
        sessions.push(session);
      }
      
      // 今後のセッション（予定）
      for (let i = 1; i <= 2; i++) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + (i * 14)); // 2週間ごと
        
        const session = await Session.create({
          pairId: pair._id,
          scheduledAt: futureDate,
          status: 'scheduled',
          agenda: ['四半期振り返り', '目標設定', 'フィードバック'][Math.floor(Math.random() * 3)],
          tags: ['定期面談']
        });
        sessions.push(session);
      }
    }
    console.log(`${sessions.length}個のセッションを作成`);

    console.log('シードデータの投入が完了しました！');
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

seed();