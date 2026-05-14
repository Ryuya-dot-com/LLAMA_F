# LLAMA F（ローカル実装）

LLAMA F は **文法推測 (grammatical inferencing)** 適性を測る短時間テストです。
参加者は **4 分間で未知言語の「文＋絵」のペア 20 個** を観察し、その言語の文法規則を推測します。
テストでは絵を見て、提示された 2 文 (A / B) のうち絵を正しく説明している方を選びます（全 20 問）。

[Meara (2005) の LLAMA-F v4.0.6](https://www.llamatests.org/tests/LLAMA_F.html) のパラダイム（抽象的な幾何図形 ＋ 一致 (agreement) 重視の人工言語）に合わせて設計されています。
言語素材 (Pelan) と絵 (SVG) はすべて本プロジェクト固有で、Meara の PATSI 言語や原版の画像は使用していません。

`index.html` と `script.js` だけで動作し、終了時に **結果が単一の Excel ファイル (.xlsx) として自動ダウンロード** されます。
UI は **日本語 / 英語の切替が可能** で、ヘッダー右上のボタンか `localStorage` 経由で設定されます。
[Ryuya-dot-com/LLAMA_B](https://github.com/Ryuya-dot-com/LLAMA_B) の構成を踏襲しています。

## 構成
- `index.html`: 画面レイアウト、説明文、スタイル
- `script.js`: 進行ロジック、刺激、i18n、ランダム化、採点、Excel/CSV 出力

## 使い方
1. `index.html` をブラウザで開く（必要に応じてローカルサーバを起動）
   ```bash
   python3 -m http.server
   ```
2. （任意）右上の言語トグルで `JP / EN` を切替
3. ID（英大文字・数字 1〜15文字）を入力して開始
4. 学習フェーズ（4分）→ テストフェーズ（20問・自分のペース）→ 結果表示
5. 結果 Excel が自動ダウンロードされる

学習フェーズは 1 分経過後に「テスト開始」が有効化されます。4 分でカードがロックされます。
（本家 LLAMA-F v4.0.6 と同じタイミング）

## 言語切替
- ヘッダー右上のトグルボタンで日本語 ⇄ 英語を即時切替
- 選択は `localStorage` の `llama_f_lang` に保存 → 次回も同じ言語で開始
- 未保存時は `navigator.language` から自動判定（ja で始まれば日本語、それ以外は英語）
- 切替は受験中もイベントログに `language_change` として記録される

## 人工言語「Pelan」の仕様

LLAMA-F の本家パラダイム（多素性接辞の集積による agreement 中心の形態論）に倣った独自の人工言語です。
**参加者にはこの仕様を見せず**、文と絵のペアから推測させます。

### 名詞語幹（形状と文法クラス）
| 語幹 | 形状 (絵) | クラス |
| --- | --- | --- |
| `tak` | 三角形 (triangle) | A (angular) |
| `kop` | 四角形 (square)   | A (angular) |
| `sin` | 円 (circle)       | B (round) |
| `dut` | 楕円 (ellipse)    | B (round) |

### 数 (number) — 名詞接尾辞（絵中の図形数を符号化）
| 接尾辞 | 数 | 絵での表現 |
| --- | --- | --- |
| -∅ (語幹のまま) | 単数 sg | 図形 1 個 |
| `-i` | 双数 dual | 図形 2 個 |
| `-un` | 複数 pl | 図形 3 個以上 |

### 一致小辞（主語の class × number に一致して挿入）
語順上は **主語名詞句のすぐ後、述語の前**に出ます。

| | sg | dual | pl |
| --- | --- | --- | --- |
| Class A | `sa` | `se` | `so` |
| Class B | `za` | `ze` | `zo` |

### 述語（空間関係）
- `em` = is above（〜の上）
- `en` = is below（〜の下）

### 語順
**SUBJ_NP + AGR + PRED + OBJ_NP**

例:
| 文 | 意味 |
| --- | --- |
| `tak sa em sin` | 1 三角が 1 円の上 |
| `taki se em sinun` | 2 三角が 3+ 円の上 |
| `dut za en kopi` | 1 楕円が 2 四角の下 |
| `sinun zo en duti` | 3+ 円が 2 楕円の下 |

### 推測すべきルール（暗黙的に学習させる）
- **R1 語順**: SVO (主語 - 一致 - 述語 - 目的語)
- **R2 数接尾辞**: ∅ / -i / -un = sg / dual / pl
- **R3 名詞クラス**: tak·kop = A、sin·dut = B
- **R4 一致**: AGR が主語の **クラス × 数** に一致 (s* vs z* がクラス、a/e/o が数)
- **R5 述語**: em / en で空間関係

### テスト項目の妨害文の内訳 (20問)
| 違反タイプ | 問題数 |
| --- | --- |
| AGR クラス違反 (s* ↔ z*) | 5 |
| AGR 数違反 (a/e/o 入れ替え) | 4 |
| 名詞数接尾辞違反 (主語側) | 4 |
| 名詞数接尾辞違反 (目的語側) | 3 |
| 述語違反 (em ↔ en) | 2 |
| 主語/目的語の取り違え | 2 |
| **合計 (うち agreement 系)** | **20 (9)** |

→ 本家 LLAMA-F の「**語順よりも agreement 重視**」の設計を反映しています。

## ランダム化仕様
- 学習フェーズの 20 枚のカード提示順: 毎回ランダム
- テストフェーズの 20 問の提示順: 毎回ランダム
- 各問の A/B の左右配置は固定（採点ロジックは `correct: "A"|"B"` に従う）
- 正答 A : 正答 B = 10 : 10 で完全均衡

## 絵の描画

各絵は **SVG で描画される抽象的な幾何図形のシーン**です。
- 上下 2 行に図形を配置（"em" 述語 = 主語が上、"en" 述語 = 主語が下）
- 各行の図形数は名詞の数を表す: 1 = sg、2 = dual、3 = pl
- 色は使わず、形状とカウントだけで情報を符号化
- 絵文字や外部画像は一切使用しません（本家 LLAMA-F の "language-independent" 設計に準拠）

## 結果ファイル仕様

終了時に **単一の Excel ファイル (.xlsx)** が自動ダウンロードされます。
ファイル名: `LLAMA_F_<ID>_YYYYMMDD_HHMMSS.xlsx`

このファイルには 4 つのシートが含まれます。

| シート名 | 行 × 列 (典型値) | 用途 |
| --- | --- | --- |
| **Meta** | 17 × 2 | 1 参加者の集計情報を縦長で確認 |
| **Wide** | 2 × 90 | **複数参加者を結合 → Cronbach's α 計算用** |
| **Trials** | 21 × 12 | 試行ごとの詳細データ |
| **Events** | (N+1) × 12 | タイムスタンプ付きの行動ログ |

> SheetJS CDN が読み込めない場合（オフライン環境など）は、
> `LLAMA_F_<ID>_<ts>.csv` と `LLAMA_F_<ID>_<ts>_events.csv` の 2 ファイル CSV にフォールバックします。

### Meta シート
| field | value |
| --- | --- |
| `experiment_id` | 参加者 ID |
| `learning_start` / `training_end` | 学習フェーズの開始・終了 |
| `test_start` / `test_end` | テストフェーズの開始・終了 |
| `training_duration_s` | 学習に実際に費やした秒数（早期終了 or 5分満了） |
| `test_duration_s` | テストフェーズの所要秒数 |
| `score` / `total` / `score_pct` | 素点 / 満点 (20) / 正答率 (%) |
| `n_window_blur` / `n_window_focus` | ウィンドウ離脱・復帰回数（注意散漫指標） |
| `n_visibility_hidden` | タブが非表示になった回数 |
| `n_fullscreen_change` | フルスクリーン状態変化回数 |
| `language_at_completion` | 完了時の UI 言語 (`ja` / `en`) |
| `user_agent` | ブラウザ UA 文字列 |

### Wide シート（α 集計用）
1 参加者 = 1 行 のフォーマットで、すべての項目データが固定カラム順に並びます。
**複数参加者の Wide シートを縦結合すれば、そのまま α / 項目分析が可能。**

```
experiment_id, score, total, score_pct, training_duration_s, test_duration_s,
n_window_blur, n_window_focus, n_visibility_hidden, n_fullscreen_change,
correct_Q01..Q20, rt_first_ms_Q01..Q20, rt_final_ms_Q01..Q20, n_changes_Q01..Q20
```

### Trials シート（長形式・試行ごと）
| 列 | 内容 |
| --- | --- |
| `trial` | 提示順 (1〜20) |
| `item_id` | アイテム ID (Q01〜Q20, 固定) |
| `sentence_a`, `sentence_b` | 提示された 2 文 |
| `correct_choice` | 正答 ("A" or "B") |
| `first_selected` | **最初**にクリックした選択肢 |
| `final_selected` | **最終的に**記録された選択肢（= 採点対象） |
| `n_changes` | 試行内で A↔B を切り替えた回数 |
| `rt_first_ms` | 絵提示から最初のクリックまでの反応時間 (ms) |
| `rt_final_ms` | 絵提示から最終クリックまでの反応時間 (ms) |
| `correct` | 1 / 0 |
| `violation_type` | 妨害文の違反タイプ（R1〜R4 など） |

### Events シート（行動ログ）
タイムスタンプ付きの行動ログ。1 行 = 1 イベント。

| 列 | 内容 |
| --- | --- |
| `iso` | ISO 8601 形式 |
| `timestamp` | `YYYY-MM-DD HH:MM:SS` |
| `t_since_pageload_ms` | ページ読み込みからの経過 ms |
| `t_since_test_start_ms` | テスト開始からの経過 ms |
| `phase` | 当時のフェーズ |
| `trial` | 当時の試行番号 |
| `event` | イベント種別 |
| `item_id`, `choice`, `rt_ms`, `is_first`, `detail` | イベント固有情報 |

記録されるイベント:
`page_load`, `learning_start`, `training_end`, `training_timeout`,
`test_phase_start`, `trial_shown`, `choice_click`, `next_click`, `end_click`,
`test_phase_end`, `window_blur` / `window_focus`,
`visibility_hidden` / `visibility_visible`, `fullscreen_change`,
`language_change`, `restart`, `exit_fullscreen_click`

## Cronbach's α の計算例

各参加者の `.xlsx` から **Wide シートだけ**を集約し、`correct_Q01`〜`correct_Q20` 列で α を求めます。

### Python (`pandas` + `pingouin`)
```python
import pandas as pd
import pingouin as pg
import glob

# すべての参加者 XLSX の Wide シートを縦結合
dfs = [pd.read_excel(f, sheet_name="Wide") for f in glob.glob("LLAMA_F_*.xlsx")]
df = pd.concat(dfs, ignore_index=True)

# Cronbach's α
items = df.filter(regex=r"^correct_Q")
alpha, ci = pg.cronbach_alpha(data=items)
print(f"Cronbach's alpha = {alpha:.3f}  (95% CI {ci})")

# 項目難易度 + 項目識別力
total = items.sum(axis=1)
item_stats = pd.DataFrame({
    "p_value":      items.mean(),
    "item_rest_r":  items.apply(lambda c: c.corr(total - c))
})
print(item_stats)
```

### R (`readxl` + `psych`)
```r
library(readxl)
library(dplyr)
library(psych)

files <- list.files(pattern = "LLAMA_F_.*\\.xlsx$", full.names = TRUE)
df <- bind_rows(lapply(files, read_excel, sheet = "Wide"))

items <- df %>% select(starts_with("correct_Q"))
alpha_result <- psych::alpha(items)
print(alpha_result$total$std.alpha)       # 標準化 α
print(alpha_result$item.stats)            # 項目難易度・識別力
```

### 推奨される追加指標
- **項目難易度 (p-value)**: 各 Q について `mean(correct)`
- **項目識別力**: 各 Q について `cor(correct_Qxx, score − Qxx)` (item-rest correlation)
- **RT 信頼性**: `rt_final_ms_Q01..Q20` で `psych::alpha()`
- **規則別正答率**: `Trials` シートを `violation_type` で集計

## チャンスレベル / 解釈
- 2AFCのチャンスレベル = 10 / 20 (50%)
- LLAMA-F の標準スコア帯（Meara, 2005）参考:
  - 0–9: very low / chance
  - 10–13: average
  - 14–17: above average
  - 18–20: high (rare)

研究用途では平均・標準偏差を別のサンプルで取得することを推奨します。

## 依存
- 外部依存:
  - Google Fonts (UI フォント) — オフライン時はシステムフォントにフォールバック
  - SheetJS CDN (`xlsx-0.20.2`) — Excel 出力に使用。読み込めない環境では自動的に CSV 2 ファイルにフォールバック
- 画像は使用せず、絵は絵文字 (`👩 🤲 🍎` 等) で表現します

## 出典・参考
- Meara, P. (2005). *LLAMA Language Aptitude Tests*. Lognostics, Swansea.
- Esposito, A., & Meara, P. (2007). A new approach to grammatical inference. *L1-L2 paper*.

本実装は LLAMA-F の方式を踏襲した独自実装であり、オリジナルの語彙・画像は使用していません。
研究用途で本ツールを利用する場合は、独自実装である旨を明記してください。
