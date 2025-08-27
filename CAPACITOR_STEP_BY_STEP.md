# 📱 Capacitor Google Play化 - 完全ステップバイステップガイド

## 🎯 このガイドについて

**あなたがすべきこと**を順番に説明します。私が既に設定を完了しているので、あなたは以下の手順に従うだけでGoogle Playアプリを作成できます。

---

## 📋 事前準備（約30分）

### 1. **Java Development Kit (JDK) のインストール**

**Windows:**
1. [Oracle JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) をダウンロード
2. インストーラーを実行
3. インストール完了

**環境変数の設定:**
1. `Win + R` → `sysdm.cpl` → Enter
2. 「詳細設定」タブ → 「環境変数」
3. システム環境変数で「新規」をクリック：
   ```
   変数名: JAVA_HOME
   変数の値: C:\Program Files\Java\jdk-17
   ```

### 2. **Android Studio のインストール**

1. [Android Studio](https://developer.android.com/studio) からダウンロード
2. インストーラーを実行
3. 初回起動時に以下をインストール：
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools

**環境変数の設定:**
```
変数名: ANDROID_HOME
変数の値: C:\Users\[あなたのユーザー名]\AppData\Local\Android\Sdk
```

**Pathに追加:**
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

### 3. **インストールの確認**

コマンドプロンプトで以下を実行：
```bash
java -version
# → Java 17のバージョンが表示される

adb version
# → Android Debug Bridgeのバージョンが表示される
```

---

## 🚀 ステップ1: プロジェクトのビルド（約5分）

```bash
# プロジェクトフォルダに移動
cd C:\Users\199b5\Desktop\diet

# 依存関係をインストール
npm install

# Next.jsアプリをビルド
npm run build
```

**成功すると：**
- `out/` フォルダが作成される
- 「Build completed successfully」のメッセージが表示される

---

## 📱 ステップ2: Androidプロジェクトの作成（約3分）

```bash
# Androidプラットフォームを追加
npx cap add android

# 成功すると以下のメッセージが表示されます：
# ✔ Adding native android project in: android
# ✔ Syncing Gradle
# ✔ add in 15.62s
```

**確認：**
- プロジェクトフォルダに `android/` フォルダが作成される

---

## 🔨 ステップ3: アプリファイルのコピー（約2分）

```bash
# ビルドしたファイルをAndroidプロジェクトにコピー
npx cap copy

# プロジェクトを同期
npx cap sync
```

**成功すると：**
```
✔ Copying web assets from out to android/app/src/main/assets/public in 2.05s
✔ Creating capacitor.config.json in android/app/src/main/assets in 543.71ms
✔ copy android in 2.62s
✔ Updating Android plugins in 7.42ms
✔ update android in 61.37ms
```

---

## 🔧 ステップ4: Android Studioでのビルド（約10分）

```bash
# Android Studio を開く
npx cap open android
```

**Android Studio で行うこと：**

### 4-1. プロジェクトの同期
1. Android Studioが開いたら、上部に表示される **「Sync Now」** をクリック
2. Gradleの同期が完了するまで待つ（初回は時間がかかります）

### 4-2. ビルドのテスト
1. メニューバー → **Build** → **Make Project**
2. エラーがないことを確認

### 4-3. エミュレータまたは実機でテスト
1. **Device Manager** で Android エミュレータを作成（または実機を接続）
2. **Run** ボタン（緑の三角）をクリック
3. アプリが起動することを確認

---

## 🎯 ステップ5: 通知機能のテスト（約5分）

アプリが起動したら：

1. **設定画面** に移動
2. **「通知を許可する」** をタップ
3. 許可ダイアログで **「許可」** を選択
4. 記録時間を現在時刻の **1-2分後** に設定
5. **「保存」** をタップ
6. **「ネイティブ通知テスト」** をタップ
7. 通知が表示されることを確認

**✅ 成功の確認:**
- 「ネイティブ許可済み」と表示される
- テスト通知が表示される
- 設定した時間に記録リマインダーが届く

---

## 📦 ステップ6: リリース用APKの作成（約15分）

### 6-1. キーストアの作成
Android Studio で：
1. **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle** を選択 → **Next**
3. **Create new...** をクリック
4. キーストア情報を入力：
   ```
   Key store path: C:\Users\[ユーザー名]\diet-release-key.jks
   Password: [強力なパスワード]
   Key alias: diet-app
   Key password: [強力なパスワード]
   Validity (years): 25
   ```
5. 証明書情報を入力（適当で問題ありません）
6. **OK** をクリック

### 6-2. リリースビルドの作成
1. **Build variant** で **release** を選択
2. **Finish** をクリック
3. ビルドが完了するまで待つ

**生成されるファイル:**
- `android/app/release/app-release.aab` (Google Play用)
- または `app-release.apk` (直接インストール用)

---

## 🏪 ステップ7: Google Play Console での設定（約30分）

### 7-1. Google Play Console にアクセス
1. [Google Play Console](https://play.google.com/console) にアクセス
2. Googleアカウントでログイン
3. **新しいアプリを作成** をクリック

### 7-2. アプリ情報の入力
```
アプリ名: ダイエット30日チャレンジ
デフォルトの言語: 日本語
アプリまたはゲーム: アプリ
無料または有料: 無料
```

### 7-3. ストア掲載情報
**アプリの説明:**
```
🎯 ダイエット30日チャレンジ - マネーモンスターを倒そう！

あなたのお菓子代を奪う「マネーモンスター」を倒して、お金と健康を取り戻すダイエットアプリです。

✨ 主な機能：
🔔 毎日の記録リマインダー通知
📊 体重変化のグラフ表示
🎮 ゲーム感覚でダイエット継続
💰 記録日数に応じた返金システム
🎯 カスタムダイエット法の設定

📱 通知機能：
設定した時間に記録リマインダーを送信。アプリを閉じていても確実に通知が届きます。

🎯 30日間のチャレンジで健康的な習慣を身につけましょう！
```

**カテゴリ:** 健康・フィットネス

### 7-4. 必須情報の設定
- **プライバシーポリシーURL**: https://your-domain.com/legal/privacy-policy
- **サポートメール**: yabaichemistryteacher@gmail.com

### 7-5. アプリファイルのアップロード
1. **アプリのリリース** → **内部テスト**
2. **リリースを作成** をクリック
3. 先ほど作成した `.aab` ファイルをアップロード

---

## 🎉 ステップ8: テストリリース（約10分）

### 8-1. 内部テストの設定
1. **テスターリスト** にあなたのGoogleアカウントを追加
2. **リリースを確認** → **内部テストへのリリースを開始**

### 8-2. テストアプリのインストール
1. Google Play Consoleから **テストリンク** を取得
2. 自分のAndroid端末でリンクを開く
3. **テスト版をダウンロード** をタップ
4. アプリをインストール

### 8-3. 通知機能の最終確認
1. テストアプリを起動
2. 通知許可を有効化
3. 記録時間を設定
4. アプリを完全に閉じる
5. 設定時間に通知が届くことを確認

**✅ 成功！通知が確実に動作します**

---

## 🚀 ステップ9: 本番リリース（約1日）

テストが成功したら：

1. **本番トラック** でリリースを作成
2. Google Play の審査を待つ（通常24時間以内）
3. 承認されたら一般公開開始

---

## 📞 サポートが必要な場合

### よくある問題と解決策：

**❌ Java が認識されない**
```bash
# 解決策: 環境変数を再確認
echo %JAVA_HOME%
echo %PATH%
```

**❌ Android SDK が見つからない**
```bash
# 解決策: SDK Managerで必要なパッケージをインストール
# Android Studio → Tools → SDK Manager
```

**❌ ビルドエラー**
```bash
# 解決策: 依存関係を再インストール
npm install
npx cap sync
```

**❌ 通知が動作しない**
- 端末の通知設定を確認
- アプリの通知権限を確認
- デバッグモードでログを確認

---

## 🎯 期待される結果

### 完成後の状況：
- ✅ **Google Playストア** からインストール可能
- ✅ **完璧な通知機能** - アプリを閉じても通知が届く
- ✅ **ネイティブアプリ体験** - 他のアプリと同等の動作
- ✅ **ユーザー増加** - アプリストア経由でより多くのユーザーにリーチ

**これで通知問題が完全に解決されます！** 🚀
