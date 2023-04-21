# CPSSソース修正

## 機能
旧CPSSのコーディング規約はハンガリアン記法をもとにしたMFCの規約をもとに作成したものでしたが、現在では陳腐化していますので、現在もっとも使われている PSR-1 に準拠した書式に自動変換します。

### 一括修正
`nekoaisle.cpssCorrector`

下記の修正を一括して実行します。

### 関数ヘッダー修正
`nekoaisle.cpssCorrector-header`

クラスや関数ヘッダーは古いJavaDocに準拠したドキュメンター用に書かれています。これを、PHP-Document 形式に近い形に整形します。

### 制御構造修正

`nekoaisle.cpssCorrector-control`

if や for の { を改行後に記述していましたが同一行に修正します。

### スペース付き丸括弧修正
`nekoaisle.cpssCorrector-parent`

スペース付きの丸括弧をスペースなしにします。

```php
if ( $a == 2 )  
	↓
if ($a == 2)
```

## コマンド

|コマンド|機能|
|-|-|
|nekoaisle.cpssCorrector|旧CPSSsauce修正|
|nekoaisle.cpssCorrector-header|関数ヘッダー修正|
|nekoaisle.cpssCorrector-control|制御構造修正|
|nekoaisle.cpssCorrector-parent|スペース付き丸括弧修正|

