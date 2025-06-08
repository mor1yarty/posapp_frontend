import { test, expect } from '@playwright/test';

test.describe('POSアプリケーション E2Eテスト', () => {
  
  test.beforeEach(async ({ page }) => {
    // 各テスト前にPOSアプリケーションページに移動
    await page.goto('/');
  });

  test('ページが正常に読み込まれる', async ({ page }) => {
    // ページタイトルが正しいことを確認
    await expect(page).toHaveTitle('POSアプリケーション');
    
    // メインヘッダーが表示されることを確認
    await expect(page.locator('h1')).toContainText('POSアプリケーション');
    
    // 商品検索セクションが表示されることを確認
    await expect(page.locator('h2').first()).toContainText('商品検索');
    
    // 購入品目リストセクションが表示されることを確認
    await expect(page.locator('h2').last()).toContainText('⑥ 購入品目リスト');
  });

  test('商品検索UI要素が正しく表示される', async ({ page }) => {
    // 商品コード表示エリアが存在することを確認
    const codeDisplay = page.locator('input[placeholder="② コード表示エリア"]');
    await expect(codeDisplay).toBeVisible();
    
    // スキャン（カメラ）ボタンが存在することを確認
    const scanButton = page.locator('button:has-text("① スキャン（カメラ）")');
    await expect(scanButton).toBeVisible();
    
    // 購入ボタンが初期状態で無効になっていることを確認
    const purchaseButton = page.locator('button:has-text("⑦ 購入")');
    await expect(purchaseButton).toBeDisabled();
  });

  test('有効な商品コードで商品検索が動作する', async ({ page }) => {
    // 商品コード入力フィールドに有効なコードを入力
    const codeInput = page.locator('input[placeholder="② コード表示エリア"]');
    await codeInput.fill('4901681143115');
    
    // 手動検索ボタンをクリック
    const loadButton = page.locator('button:has-text("手動検索")');
    await loadButton.click();
    
    // 商品名が表示されることを確認（APIレスポンス待ち）
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    
    // 色が表示されることを確認
    await expect(page.locator('.info-value').nth(1)).toContainText('ブラック');
    
    // 品番が表示されることを確認
    await expect(page.locator('.info-value').nth(2)).toContainText('JJ15-BK');
    
    // 商品価格が表示されることを確認
    await expect(page.locator('.info-value').nth(3)).toContainText('¥110');
    
    // 数量が表示されることを確認
    await expect(page.locator('.info-value').last()).toContainText('1');
    
    // 追加ボタンが表示されることを確認
    const addButton = page.locator('button:has-text("⑤ 購入リストへ追加")');
    await expect(addButton).toBeVisible();
  });

  test('無効な商品コードでエラーメッセージが表示される', async ({ page }) => {
    // 無効な商品コード入力
    const codeInput = page.locator('input[placeholder="② コード表示エリア"]');
    await codeInput.fill('0000000000000');
    
    // 読み込みボタンをクリック
    const loadButton = page.locator('button:has-text("手動検索")');
    await loadButton.click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('.error-message')).toContainText('商品がマスタ未登録です', { timeout: 5000 });
  });

  test('商品を購入リストに追加できる', async ({ page }) => {
    // 商品検索を実行
    const codeInput = page.locator('input[placeholder="② コード表示エリア"]');
    await codeInput.fill('4901681143115');
    
    const loadButton = page.locator('button:has-text("手動検索")');
    await loadButton.click();
    
    // 商品情報が表示されるのを待つ
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    
    // 購入リストに追加
    const addButton = page.locator('button:has-text("⑤ 購入リストへ追加")');
    await addButton.click();
    
    // 購入リストに商品が追加されることを確認（新しい列構成に対応）
    const purchaseItem = page.locator('.purchase-item').first();
    await expect(purchaseItem).toContainText('サラサクリップ'); // 商品名
    await expect(purchaseItem).toContainText('ブラック'); // 色
    await expect(purchaseItem).toContainText('JJ15-BK'); // 品番
    await expect(purchaseItem).toContainText('1'); // 数量
    await expect(purchaseItem).toContainText('¥110'); // 単価
    await expect(purchaseItem).toContainText('¥110'); // 小計
    
    // 合計金額が表示されることを確認
    await expect(page.locator('.total-amount')).toContainText('合計: ¥110');
    
    // 購入ボタンが有効になることを確認
    const purchaseButton = page.locator('button:has-text("⑦ 購入")');
    await expect(purchaseButton).toBeEnabled();
    
    // 成功メッセージが表示されることを確認
    await expect(page.locator('.success-message')).toContainText('商品を購入リストに追加しました');
  });

  test('複数の商品を購入リストに追加できる', async ({ page }) => {
    // 1つ目の商品を追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143115');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 2つ目の商品を追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143139');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await expect(page.locator('.info-value').nth(1)).toContainText('レッド');
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 購入リストに2つの商品が表示されることを確認
    const purchaseItems = page.locator('.purchase-item');
    await expect(purchaseItems).toHaveCount(2);
    
    // 合計金額が正しく計算されることを確認（110 + 110 = 220）
    await expect(page.locator('.total-amount')).toContainText('合計: ¥220');
  });

  test('購入処理が正常に実行される', async ({ page }) => {
    // 商品を購入リストに追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143115');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 購入ボタンをクリック
    const purchaseButton = page.locator('button:has-text("⑦ 購入")');
    await purchaseButton.click();
    
    // 税表示モーダルが表示されることを確認
    await expect(page.locator('text=購入完了')).toBeVisible({ timeout: 10000 });
    
    // OKボタンをクリック
    const closeButton = page.locator('button:has-text("OK")');
    await closeButton.click();
    
    // 購入リストがクリアされることを確認
    await expect(page.locator('.purchase-item')).toHaveCount(0);
    await expect(page.locator('text=購入商品がありません')).toBeVisible();
    
    // 購入ボタンが再び無効になることを確認
    await expect(purchaseButton).toBeDisabled();
  });

  test('商品削除機能が動作する', async ({ page }) => {
    // 商品を購入リストに追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143115');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 削除ボタンをクリック
    const deleteButton = page.locator('button:has-text("削除")');
    await deleteButton.click();
    
    // 購入リストから商品が削除されることを確認
    await expect(page.locator('.purchase-item')).toHaveCount(0);
    await expect(page.locator('text=購入商品がありません')).toBeVisible();
    
    // 購入ボタンが無効になることを確認
    const purchaseButton = page.locator('button:has-text("⑦ 購入")');
    await expect(purchaseButton).toBeDisabled();
  });

  test('同じ商品を複数回追加すると数量が増加する', async ({ page }) => {
    // 同じ商品を2回追加
    for (let i = 0; i < 2; i++) {
      await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143115');
      await page.locator('button:has-text("手動検索")').click();
      await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
      await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    }
    
    // 購入リストに1つの商品アイテムのみ表示されることを確認
    await expect(page.locator('.purchase-item')).toHaveCount(1);
    
    // 数量が2になることを確認
    await expect(page.locator('.purchase-item').first()).toContainText('2');
    
    // 小計が正しく計算されることを確認（110 × 2 = 220）
    await expect(page.locator('.purchase-item').first()).toContainText('¥220');
    
    // 合計金額が正しいことを確認
    await expect(page.locator('.total-amount')).toContainText('合計: ¥220');
  });

  test('文房具商品の詳細情報表示機能テスト', async ({ page }) => {
    // マッキーシリーズの商品をテスト
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681502516');
    await page.locator('button:has-text("手動検索")').click();
    
    // 商品詳細情報が正しく表示されることを確認
    await expect(page.locator('.info-label').first()).toContainText('③ 商品名');
    await expect(page.locator('.info-value').first()).toContainText('ハイマッキー', { timeout: 5000 });
    
    await expect(page.locator('.info-label').nth(1)).toContainText('色');
    await expect(page.locator('.info-value').nth(1)).toContainText('ブラック');
    
    await expect(page.locator('.info-label').nth(2)).toContainText('品番');
    await expect(page.locator('.info-value').nth(2)).toContainText('MO-150-MC-BK');
    
    await expect(page.locator('.info-label').nth(3)).toContainText('④ 単価');
    await expect(page.locator('.info-value').nth(3)).toContainText('¥165');
    
    await expect(page.locator('.info-label').nth(4)).toContainText('数量');
    await expect(page.locator('.info-value').nth(4)).toContainText('1');
  });

  test('購入リストの詳細表示テスト', async ({ page }) => {
    // マイルドライナー商品を追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681400713');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('マイルドライナー', { timeout: 5000 });
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 購入リストのヘッダーが正しく表示されることを確認
    const headers = page.locator('.purchase-header div');
    await expect(headers.nth(0)).toContainText('商品名');
    await expect(headers.nth(1)).toContainText('色');
    await expect(headers.nth(2)).toContainText('品番');
    await expect(headers.nth(3)).toContainText('数量');
    await expect(headers.nth(4)).toContainText('単価');
    await expect(headers.nth(5)).toContainText('小計');
    await expect(headers.nth(6)).toContainText('操作');
    
    // 購入リストの詳細情報が正しく表示されることを確認
    const purchaseItem = page.locator('.purchase-item').first();
    await expect(purchaseItem).toContainText('マイルドライナー');
    await expect(purchaseItem).toContainText('マイルドグレー');
    await expect(purchaseItem).toContainText('WKT7-MGR');
    await expect(purchaseItem).toContainText('1');
    await expect(purchaseItem).toContainText('¥110');
    await expect(purchaseItem).toContainText('¥110');
  });

  test('色違い商品の管理テスト', async ({ page }) => {
    // サラサクリップの黒を追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143115');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await expect(page.locator('.info-value').nth(1)).toContainText('ブラック');
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // サラサクリップの赤を追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143139');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await expect(page.locator('.info-value').nth(1)).toContainText('レッド');
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 同じ品名でも色が違えば別商品として管理されることを確認
    const purchaseItems = page.locator('.purchase-item');
    await expect(purchaseItems).toHaveCount(2);
    
    // 1つ目の商品（黒）
    await expect(purchaseItems.nth(0)).toContainText('サラサクリップ');
    await expect(purchaseItems.nth(0)).toContainText('ブラック');
    await expect(purchaseItems.nth(0)).toContainText('JJ15-BK');
    
    // 2つ目の商品（赤）
    await expect(purchaseItems.nth(1)).toContainText('サラサクリップ');
    await expect(purchaseItems.nth(1)).toContainText('レッド');
    await expect(purchaseItems.nth(1)).toContainText('JJ15-R');
    
    // 合計金額が正しく計算されることを確認
    await expect(page.locator('.total-amount')).toContainText('合計: ¥220');
  });

  test('JANスキャン機能のUI表示テスト', async ({ page }) => {
    // スキャン（カメラ）ボタンをクリック
    const scanButton = page.locator('button:has-text("① スキャン（カメラ）")');
    await scanButton.click();
    
    // バーコードスキャナーコンポーネントが表示されることを確認
    await expect(page.locator('text=🚀 高速JANスキャン')).toBeVisible();
    
    // スキャン停止ボタンが表示されることを確認
    await expect(page.locator('button:has-text("スキャン停止")')).toBeVisible();
  });


  test('購入完了時の税込・税抜表示テスト', async ({ page }) => {
    // 商品を購入リストに追加
    await page.locator('input[placeholder="② コード表示エリア"]').fill('4901681143115');
    await page.locator('button:has-text("手動検索")').click();
    await expect(page.locator('.info-value').first()).toContainText('サラサクリップ', { timeout: 5000 });
    await page.locator('button:has-text("⑤ 購入リストへ追加")').click();
    
    // 購入ボタンをクリック
    const purchaseButton = page.locator('button:has-text("⑦ 購入")');
    await purchaseButton.click();
    
    // 税表示モーダルが表示されることを確認
    await expect(page.locator('text=購入完了')).toBeVisible({ timeout: 10000 });
    
    // 税込金額が表示されることを確認
    await expect(page.locator('text=税込金額')).toBeVisible();
    await expect(page.locator('text=¥110')).toBeVisible();
    
    // 税抜金額が表示されることを確認
    await expect(page.locator('text=税抜金額')).toBeVisible();
    await expect(page.locator('text=¥100')).toBeVisible();
    
    // 消費税額が表示されることを確認
    await expect(page.locator('text=消費税')).toBeVisible();
    await expect(page.locator('text=¥10')).toBeVisible();
    
    // 閉じるボタンをクリック
    const closeButton = page.locator('button:has-text("閉じる")');
    await closeButton.click();
    
    // モーダルが閉じることを確認
    await expect(page.locator('text=購入完了')).not.toBeVisible();
  });

  test('スキャン停止機能テスト', async ({ page }) => {
    // スキャン（カメラ）ボタンをクリック
    const scanButton = page.locator('button:has-text("① スキャン（カメラ）")');
    await scanButton.click();
    
    // バーコードスキャナーが表示されることを確認
    await expect(page.locator('text=🚀 高速JANスキャン')).toBeVisible();
    
    // スキャン停止ボタンをクリック
    const stopButton = page.locator('button:has-text("スキャン停止")');
    await stopButton.click();
    
    // バーコードスキャナーが非表示になることを確認
    await expect(page.locator('text=🚀 高速JANスキャン')).not.toBeVisible();
    
    // スキャン（カメラ）ボタンが再び表示されることを確認
    await expect(scanButton).toBeVisible();
  });

});