<?php
class CpssWizard
{
	/**
	 * コマンドラインよりオプションを取得
	 * 
	 * @param array $cmd コマンドライン引数配列
	 * @return array オプション配列
	 */
	function procOption($cmd)
	{
		$ret = [];

		foreach ($cmd as $s) {
			if ($s[0] == '-') {
				if (preg_match('/^-([^=]+)(=(.*))?$/', $s, $a) == 1) {
					$ret[trim($a[1])] = trim($a[3]);
//					echo trim($a[1]), " ", trim($a[3]), "\n";
				}
			}
		}

		return $ret;
	}

	/**
	 * オプションの取得
	 * 
	 * @param string  $option オプション名
	 * @param boolean $error === true 取得出来なかったときにはエラーにする
	 * @return string オプション
	 */
	function getOption($option, $error = NULL)
	{
		if (!empty($this->options[$option])) {
			return $this->options[$option];
		}

		if (!empty($error)) {
			echo $option, ' は省略できません。' . PHP_EOL;
			$this->usage(1);
		}

		return '';
	}

	/**
	 * ヘルプ表示
	 * 
	 * @param  int $exitCode 終了コード
	 */
	function usage($exitCode = NULL)
	{
		echo <<<__USAGE__
>php CpssWizard.php -m=[モード] -f=[生成ファイル名] -a=[作成者名] -t=[タイトル] <-out=[出力ファイル名]> <-sql=[SQLファイル名]>

__USAGE__;

	//print_r($_SERVER['argv']);
	//var_dump(debug_backtrace());

		if (isset($exitCode)) {
			exit($exitCode);
		}
	}

	/**
	 * フィールド名から変数名を作成
	 * 
	 * @param  string $field フィールド名
	 * @param  string $type  型 (INT)
	 * @return 
	 */
	function makeVariableName($field, $type)
	{
		// _で分解 (最初の文字が種類を表している
		$b = explode('_', $field);
		switch ($b[0]) {
			// 数値
		case 'N':
			if ($type == 'INT') {
				$n = 'm_i';
			} else {
				$n = 'm_f';
			}
			break;

			// 日時
		case 'D':
			$n = 'm_str';
			$l = count($b)-1;
			if ($b[$l] == 'DT') {
				// 末尾が DT ならば DATE に変更
				$b[$l] = 'DATE';
			} else {
				// DT でないので DATE を追加
				$b[] = 'DATE';
			}
			break;

			// 文字列
		case 'V':
		case 'C':
		default:
			$n = 'm_str';
			break;
		}

		// 各単語をキャメルケースに変換してつなぐ
		for ($j = 1; $j < count($b); ++ $j) {
			$n .= $this->makeRowNameWord($b[$j]);
		}

		//
		return $n;
	}


	/**
	 * 先頭文字のみを大文字にした単語を作成
	 * 
	 * @param  string $str プレフィックスを除いたフィールド名
	 * @return 
	 */
	function makeRowNameWord($str)
	{
		if ($str == 'ID')
			return $str;

		return ucfirst(strtolower($str));
	}

	/**
	 * スネークケースを分解
	 * 
	 * @param  string $str 処理対象文字列
	 * @return array 分解した文字列を格納する配列
	 */
	function splitSnake($str)
	{
		return explode('_', $str);
	}

	/**
	 * キャメルケースを分解
	 * 
	 * @param  string $str 処理対象文字列
	 * @return array 分解した文字列を格納する配列
	 */
	function splitCamel($str)
	{
		if (preg_match_all('/[A-Z][^A-Z]*/s', $str, $m) > 0) {
			return $this->toLowwer($m[0]);
		} else {
			return [strtolower($str)];
		}
	}

	/**
	 * １次元配列のすべての要素を小文字に変換
	 * 
	 * @param  array $ary 分解した文字列が格納された配列
	 * @return array 小文字に変換した配列
	 */
	function toLowwer($ary)
	{
		if (is_array($ary)) {
			foreach ($ary as $k => $v) {
				$ary[$k] = strtolower($v);
			}
			return $ary;
		} else {
			return strtolower($ary);
		}
	}

	/**
	 * １次元配列のすべての要素を先頭文字のみを大文字に変換
	 * 
	 * @param  array $ary 分解した文字列が格納された配列
	 * @return array 先頭文字のみ大文字にした文字列
	 */
	function toCamel($ary)
	{
		if (is_array($ary)) {
			foreach ($ary as $k => $v) {
				$v = strtolower($v);
				$ary[$k] = ucfirst($v);
			}
			return $ary;
		} else {
			$ary = strtolower($ary);
			return ucfirst($ary);
		}
	}

	/**
	 * 配列をスネークケースに変換
	 * 
	 * @param  array $ary 分解した文字列が格納された配列
	 * @return string スネークケースに変換した文字列
	 */
	function makeSnake($ary)
	{
		// すべて小文字に変換
		$ary = $this->toLowwer($ary);
		// _でつなぐ
		return implode('_', $ary);
	}

	/**
	 * 配列をキャメルケースに変換
	 * 
	 * @param  array $ary 分解した文字列が格納された配列
	 * @return string キャメルケースに変換した文字列
	 */
	function makeCamel($ary)
	{
		// 先頭文字のみを大文字に変換
		$ary = $this->toCamel($ary);

		// 結合
		return implode('', $ary);
	}

	/**
	 * 文字列の桁数を取得
	 * 
	 * @access public
	 * @param  string $str 文字列
	 * @return int 桁数
	 * @throw  
	 */
	public function getStringCols($str)
	{
		$ary = preg_split("//u", $str, -1, PREG_SPLIT_NO_EMPTY);
		$cols = count($ary);
		foreach ($ary as $val) {
			if (strlen($val) > 1) {
				++ $cols;
			}
		}

//		echo "'{$str}' = ", strlen($str), " -> ", $cols,"\n";
		
		return $cols;
	}

	/**
	 * 指定文字で埋める
	 * 
	 * @access public
	 * @param  
	 * @return 
	 * @author 木屋 善夫
	 * @throw  
	 */
	public function padString($str, $len, $pad = ' ', $type = STR_PAD_RIGHT)
	{
		// 埋める文字列の桁数を取得
		$len = $len - $this->getStringCols($str);
		if ($len <= 0) {
			// 文字列の桁数が $len 以上なので何もしない
			return $str;
		}

		// 
		switch($type) {
			case STR_PAD_RIGHT: {
				$str .= str_repeat($pad, $len);
				break;
			}
			case STR_PAD_LEFT: {
				$str = str_repeat($pad, $len) . $str;
				break;
			}
			case STR_PAD_BOTH: {
				$l = (int)floor($len / 2);
				$lf = str_repeat($pad, $l);
				$rg = str_repeat($pad, $len - $l);
				$str = $lf . $str . $rg;
				break;
			}
		}

		//
		return $str;
	}

	/**
	 * テンプレートの読み込み
	 * 
	 * @param string $mode 処理モード (-m オプション)
	 * @param string $ext  拡張子
	 * @param string $dir  対象ディレクトリ名
	 * @return string テンプレートファイル
	 */
	function loadTemplate($mode, $ext, $dir)
	{
		// 読み込むファイル候補
		$files = [];
		$t = $this->getOption('tmpl');
		if (!empty($t)) {
			// テンプレートが指定されている
			$files[] = $t;
		} else {
			// テンプレートが指定されていなかった
			$list = [
				// 標準テンプレート
				// ./template フォルダーを探しなければ同一フォルダーを探す
				'standard'       => ["{$dir}\\template\\template{$ext}", "{$dir}\\template{$ext}"],
				// トランザクション基本クラス
				'TransBase'      => ["{$dir}\\template\\TransBase{$ext}"],
				// トランザクション初期化ページ
				'TransInit'      => ["{$dir}\\template\\TransInit{$ext}"],
				// トランザクション編集ページ
				'TransEdit'      => ["{$dir}\\template\\TransEdit{$ext}"],
				// トランザクション確認ページ
				'TransConfirm'   => ["{$dir}\\template\\TransConfirm{$ext}"],
				// トランザクション完了ページ
				'TransCompleted' => ["{$dir}\\template\\TransCompleted{$ext}"],
				// 一覧初期化ページ
				'ListInit'       => ["{$dir}\\template\\ListInit{$ext}"],
				// 一覧ページ
				'ListList'       => ["{$dir}\\template\\ListList{$ext}"],
				// CCamRow 派生クラス
				'Row'            => ["{$dir}\\template\\Row{$ext}"],
			];
			if (empty($list[$mode])) {
				$this->usage(1);
			};

			$files = $list[$mode];
	//print_r($files);
		}

		// テンプレートを開く
		foreach ($files as $t) {
	//		echo "check $t" . PHP_EOL;
			if (file_exists($t)) {
	//			echo "load $t" . PHP_EOL;
				$template = $this->loadTextFile($t);
				break;
			}
		}

		if (empty($template) ) {
			echo 'テンプレート', implode(', ', $files), ' が開けませんでした', "\n";
			exit(1);
		}

		//
		return $template;
	}

	/**
	 * テキストファイルを読み込む
	 * 
	 * @access public
	 * @param  string $filename ファイル名
	 * @return string 読み込んだファイルの内容
	 */
	function loadTextFile($filename)
	{
		$text = file_get_contents($filename);
		$enc = mb_detect_encoding($text, "SJIS-win, UTF-8");
		if ($enc != 'UTF-8') {
			$text = mb_convert_encoding($text, 'UTF-8', $enc);
		}

		return $text;
	}

	/**
	 * SQLファイルからテーブル情報を取得
	 * 
	 * @access public
	 * @param  string $sqlFile SQLファイル名
	 * @return テーブル情報配列
	 * @author 木屋 善夫
	 * @throw  
	 */
	public function loadTable($sqlFile)
	{
		$ret = [
			'NAME' => '',
			'SQL' => '',
			'ROWS' => [],
		];

		// SQL 読み込み
		$sql = $this->loadTextFile($sqlFile);
		
		// テーブル名取得
		if (preg_match('/CREATE\s+TABLE\s+([0-9A-Z_]+)/i', $sql, $a) === 1) {
			$ret['NAME'] = $a[1];
		}

		// SQL 文
		if (preg_match('/(CREATE\s+TABLE\s[^;]+;)/i', $sql, $a) === 1) {
			// CREATE TABLE 全体
			$ret['SQL'] = $a[1];

			// フィールド定義の作成
			if (strstr($a[1], "\r\n")) {
				$aryCol = explode("\r\n", $a[1]);
			} else {
				$aryCol = explode("\n", $a[1]);
			}

			// (のみの行までスキップ
			for ($i = 0; $i < count($aryCol); ++ $i) {
				$s = trim($aryCol[$i]);
				if ($s == '(') {
					++ $i;
					break;
				}
			}

			//) のみの行まで処理
			$search = [];
			$sort   = ['' => ''];
			for ($i = 0; $i < count($aryCol); ++ $i) {
				$s = trim($aryCol[$i]);
				if ($s == ')')
					break;

				// , V_MAILMAG_ID    VARCHAR(  64, 4) NOT NULL DEFAULT '' -- メルマガID ACCOUNT.V_ID
				$pt = 
					  '/^'
					. ',?\s*'									// , 
					. '([^\s]+)\s+'								// [1] V_MAILMAG_ID
					. '([^\s\(]+)\s*'							// [2] VARCHAR
					. '(?:\(\s*'
						. '([0-9]+)\s*'							// [3] 64
						. '(?:,\s*'
							. '([0-9]+)\s*'						// [4] 4
						. ')?'
						. '\)\s*'
					. ')?'
					. '(?:'
						. '(NOT\s*NULL)'						// [5] NOT NULL
						. '|'
						. '(PRIMARY\s*KEY)'						// [6] 
					. ')*\s*'
					. '(?:'
						. 'DEFAULT\s+'
							. '(\'[^\']*\'|[0-9]+|NULL)'		// [7] ''
					. ')?\s*'
					. ',?\s*'
					. '-- '
					. '(.*)'									// [8] メルマガID ACCOUNT.V_ID
					. '$/i'
				;

				if (preg_match($pt, $s, $a) !== 1) {
					// 行定義ではない
					continue;
				}

				$s = explode('_', $a[1]);
				array_shift($s);
				$s = implode('_', $s);

				$a['name'   ] = $a[1];					// 名前
				$a['name_suffix'] = $s;					// 名前のサフィックス V_ などを除去
				$a['type'   ] = strtoupper($a[2]);		// 型
				$a['size'   ] = (int)$a[3] + (int)$a[4] + ((int)$a[4] ? 1 : 0);	// サイズ
				$a['default'] = (strlen($a[7]) > 0) ? $a[7] : "''";
				$b = explode(' ', $a[8]);
				$a['title'  ] = $b[0];

				$ret['ROWS'][] = $a;
			}
		}

		//
		return $ret;
	}

	/**
	 * CamRow派生クラス用 SQL情報の処理
	 * 
	 * @param  array& $replace 置換情報配列
	 * @param  array $table テーブル情報配列
	 */
	function jobRow(&$replace, $table)
	{
		// 行を処理
		$src = [];
		$len = [];	// 最大列長
		foreach ($table['ROWS'] as $a) {
			switch ($a['name']) {
				case 'D_REGIST_DT':
				case 'D_UPDATE_DT':
				case 'V_NOTE':
					continue 2;
			}

			// 型を変換
			switch ($a['type']) {
			case 'NUMERIC':
				if (empty($a[4])) {
					// 小数部がないので整数
					$a['type'] = 'INT';
				} else {
					// 小数部があるので浮動小数点
					$a['type'] = 'DOUBLE';
				}
				break;
			
			case 'BLOB':
				$a['type'] = 'VARCHAR';
				$a['size'] = 4095;
				break;
			}

			// 変数名を作成
			$n = $this->makeVariableName($a['name'], $a['type']);

			// デフォルトが省略されているときは NULL
			if ($a['name'] == 'V_ID') {
				$a['default'] = "''";
			} else if (!isset($a['default']) || ($a['default'] === '')) {
				$a[11] = 'NULL';
			}

			// 作成した列情報を保存
			$src[] = $b = [
				$a['name'],				// 'V_NAME'
				$n,						// 'm_strName'
				$a['type'],				// 'VARCHAR'
				'true',					// true
				$a['default'],			// ''
				$a['title'],			// 'メールマガジン名'
				(string)($a['size'])	// 64
			];

			// 桁揃えのため各単語の最大長を更新
			foreach ($b as $k => $v) {
				$l = $this->getStringCols($v);
				if (empty($len[$k]) || ($len[$k] < $l)) {
					$len[$k] = $l;
				}
			}
		}

		$col = [];
		$var = [];
		$dic = [];
		foreach ($src as $a) {
			// 列定義
			$col[] = sprintf("[%s, %s, %s, %s, %s, %s, %s]"
				, $this->padString("'{$a[0]}'", $len[0] + 2)
				, $this->padString("'{$a[1]}'", $len[1] + 2)
				, $this->padString("'{$a[2]}'", $len[2] + 2)
				, $this->padString(   $a[3]   , $len[3])
				, $this->padString(   $a[4]   , $len[4])
				, $this->padString("'{$a[5]}'", $len[5] + 2)
				, $this->padString(   $a[6]   , $len[6], ' ', STR_PAD_LEFT)
			);

			// 変数定義
			$v = $this->padString($a[1], $len[1]);
			$var[] = "\tpublic \$$v;\t// {$a[0]}\r\n";
			
			// 列名→変数名変換辞書
			$dic[] = sprintf("%s => '%s'", $this->padString("'{$a[0]}'", $len[0]+2), $a[1]);
		}

		$replace['//___column___'  ] = "\t\t" . implode(",\r\n\t\t", $col);
		$replace['//___coldic___'  ] = "\t\t" . implode(",\r\n\t\t", $dic);
		$replace['//___variable___'] = implode('', $var);
	}

	/**
	 * ListBaseクラス用 SQL情報の処理
	 * 
	 * @param  string& $template テンプレート
	 * @param  array& $replace   置換情報配列
	 * @param  array $table テーブル情報配列
	 */
	function jobListBaseSQL(&$template, &$replace, $table)
	{
		// テンプレートから列タイプごとのテンプレートを取得
		$temple = [];
		$temple['V_ID'] = <<<_EOL_
			'V_ID' => [ 
				'CLASS'   => 'string',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => '',
				'TITLE'   => 'ID',
				'LESS'    => true,
				'MAXLEN'  => 64,
				'ATTRIB'  => 'size="48"',
				'search'  => 'like',
			],
_EOL_;
		$temple['C_STATUS'] = <<<_EOL_
			'C_STATUS' => [ 
				'CLASS'   => 'string',
				'TAG'     => 'select',
				'DEFAULT' => '',
				'TITLE'   => '状態',
				'MAXLEN'  =>   3,
				'LESS'    => true,
				'OPTION'  => [''=>''],
				'search'  => 'status',
			],
_EOL_;
		$temple['NUMERIC'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'number',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
				'MINNUM'  => 0,
				'MAXNUM'  => 9999999,
				'search'  => 'like',
			],
_EOL_;
		$temple['BLOB'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'textarea',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
				'MAXLEN'  => 4096,
				'ATTRIB'  => 'rows="5"',
				'CTRL'    => "\t\r\n",
				'HTML'    => true,			// <>"' を許可
				'search'  => 'like',
			],
_EOL_;
		$temple['VARCHAR'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
				'search'  => 'like',
			],
_EOL_;
		$temple['CHAR'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'select',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'MAXLEN'  =>   3,
				'LESS'    => true,
				'OPTION'  => [''=>''],
				'search'  => 'status',
			],
_EOL_;
		$temple['DATE'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'date',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => '',
				'TITLE'   => '___title___(最小)',
				'DTFMT'   => 'YmdHis',
				'DSPFMT'  => 'Y/m/d H:i:s',
				'LESS'    => true,
				'ATTRIB'  => 'data-cpss="datetime"',
				'search'  => 'between ___name____END',
				'head'    => '開始日時',
				'style'   => 'width:12em;',
			],
			'___name___' => [
				'CLASS'   => 'date',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => '',
				'TITLE'   => '___title___(最大)',
				'DTFMT'   => 'YmdHis',
				'DSPFMT'  => 'Y/m/d H:i:s',
				'LESS'    => true,
				'ATTRIB'  => 'data-cpss="datetime"',
				'search'  => 'between',
				'combine' => true,
				'style'   => 'width:12em;',
				'prefix'  => ' ～ ',
			],
_EOL_;

	/*     記述例
	//@@row_form_temple NUMERIC {
				'___name___'      => [ 
					'CLASS'   => 'string',
					'TAG'     => 'input',
					'TYPE'    => 'text',
					'DEFAULT' => 848635851342 ,
					'TITLE'   => '___title___',
					'MAXLEN'  => 19,
					'ACCEPT'  => '0-9',
				],
	//}@@
	*/
		$re = 
			  '`'
			. '//@@row_form_temple\s+'
			. '([A-Z0-9_]+)'				// $m[1] テンプレート名
			. '\s*{[^\n]*\n'
			. '(.*?)'						// $m[3] テンプレート
			. '//}@@[^\n]*\n'
			. '`s'
		;
		if (preg_match_all($re, $template, $m, PREG_SET_ORDER) >= 1) {		
			// テンプレートを取得
			foreach ($m as $p) {
				$temple[$p[1]] = $p[2];
			}

			// テンプレートを削除
			$template = preg_replace($re, '', $template);
		}

		// 行を処理
		$search = [];
		$sort   = ['' => ''];
		foreach ($table['ROWS'] as $a) {
			switch ($a['name']) {
			case 'D_REGIST_DT':
			case 'D_UPDATE_DT':
			case 'V_NOTE':
				continue 2;
			}

			// この名前のテンプレートがあればそのまま使用
			if (!empty($temple[$a['name']])) {
				// 検索用
				$search[] = rtrim($temple[$a['name']]);
				// ソート用
				$sort[$a['name']] = $a['title'];
				continue;
			}

			// 型を変換
			switch ($a['type']) {
			case 'BLOB':
				$a['type'] = 'VARCHAR';
				$a['size'] = 4095;
				break;
			}

			// デフォルトが省略されているときは ''
			if (!isset($a[11])) {
				$a[11] = '';
			}

			// この列型のテンプレートを取得
			if (substr($a['name'], 0, 2) == 'D_') {
				// D_ ではじまるカラムは日付
				$tmp = rtrim($temple['DATE']);
			} else {
				// カラムの型ごとのテンプレ
				$tmp = rtrim($temple[$a['type']]);
			}

			// 置換
			$rep = [
				'___name___'    => $a['name'],
				'___name_suffix___'    => $a['name_suffix'],
				'___default___' => $a['default'],
				'___title___'   => $a['title'],
				'___maxlen___'  => (string)($a['size']),
			];
			
			$search[] = str_replace(array_keys($rep), array_values($rep), $tmp);

			// ソート用
			$sort[$a['name']] = $a['title'];
		}

		$replace['//___row_form___'] = implode("\r\n", $search);

		// ソート用
		// 桁揃えのため最大の長さを取得
		$len = 0;
		foreach ($sort as $k => $v) {
			$l = $this->getStringCols($k);
			if ($len < $l) {
				$len = $l;
			}
		}
		$len += strlen($replace['___TABLE___']) + 2 + 1;	// 2='' 1=.

		$sort2 = [];
		foreach ($sort as $k => $v) {
			if (empty($k)) {
				$k = $this->padString("''", $len, ' ');
			} else {
				$k = $this->padString("'{$replace['___TABLE___']}.{$k}'", $len, ' ');
			}
			$sort2[] = "\t\t\t{$k} => '{$v}'";
		}

		$replace['___sort___'] = implode(",\r\n", $sort2);
	}

	/**
	 * ListListクラス用 SQL情報の処理
	 * 
	 * @access public
	 * @param  string& $template テンプレート
	 * @param  array& $replace   置換情報配列
	 * @param  array $table テーブル情報配列
	 * @author 木屋 善夫
	 */
	public function jobListListSQL(&$template, &$replace, $table)
	{
		// ヘッダー作成
		$strs[] = <<<_EOL_
			// ヘッダータイトル指定(省略可)
			'HEADER' => [
_EOL_;
		foreach ($table['ROWS'] as $row) {
			// SQL 読み込み
			switch ($row['name']) {
				case 'V_ID':
				case 'D_REGIST_DT':
				case 'D_UPDATE_DT':
				case 'V_NOTE':
					continue 2;
			}
				
			$strs[] = "\t\t\t\t'{$row['name']}' => '{$row['title']}',";
		}
		$strs[] = "\t\t\t],";

		// 表示列を設定
		$strs[] = <<<_EOL_
			// 表示する列を指定
			// 値が 'ADD' ならば自動生成
			'COLUMN' => [
				'V_ID' => 'FIX',
_EOL_;
		foreach ($table['ROWS'] as $row) {
			// SQL 読み込み
			switch ($row['name']) {
				case 'V_ID':
				case 'D_REGIST_DT':
				case 'D_UPDATE_DT':
				case 'V_NOTE':
					continue 2;
			}

			$strs[] = "\t\t\t\t'{$row['name']}' => 'ADD',";
		}
		$strs[] = "\t\t\t],";

		// 列に設定する HtmlViewコマンド
		$strs[] = <<<_EOL_
			// 列に設定する HtmlViewコマンド
			// 指定されていない列は "'@{$row['name']} set"
			'COMMAND' => [
				'V_ID' => "'@V_ID input' set @ value",
_EOL_;
		foreach ($table['ROWS'] as $row) {
			// SQL 読み込み
			switch ($row['name']) {
				case 'V_ID':
				case 'D_REGIST_DT':
				case 'D_UPDATE_DT':
				case 'V_NOTE':
					continue 2;
			}

			switch (substr($row['name'], 0, 1)) {
				// 日付
				case 'D': {
					$strs[] = "\t\t\t\t'{$row['name']}' => '@{$row['name']} set %-',";
					break;
				}
			}
		}
		$strs[] = "\t\t\t],";

		$replace['___list_params___'] = implode("\r\n", $strs);
	}

	/**
	 * EditBaseクラス用 SQL情報の処理
	 * 
	 * @param  string& $template テンプレート
	 * @param  array& $replace   置換情報配列
	 * @param  array $table テーブル情報配列
	 */
	function jobEditBaseSQL(&$template, &$replace, $table)
	{
		// テンプレートから列タイプごとのテンプレートを取得
		$temple = [];
		$temple['V_ID'] = <<<_EOL_
			'V_ID' => [ 
				'CLASS'   => 'string',
				'TAG'     => 'static',
				'DEFAULT' => '',
				'TITLE'   => 'ID',
				'LESS'    => true,
				'MAXLEN'  => 64,
				'ATTRIB'  => 'size="48"',
			],
_EOL_;
		$temple['C_STATUS'] = <<<_EOL_
			'C_STATUS' => [ 
				'CLASS'   => 'string',
				'TAG'     => 'select',
				'DEFAULT' => 'VLD',
				'TITLE'   => '状態',
				'MAXLEN'  => 3,
				'OPTION'  => [''=>''],
			],
_EOL_;
		$temple['DATE'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'date',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
				'ATTRIB'  => 'data-cpss="datetime"',
				'format'  => 'Y-m-d H:i:s',
			],
_EOL_;
		$temple['NUMERIC'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'text',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
				'MINNUM'  => 0,
				'MAXNUM'  => 9999999,
			],
_EOL_;
		$temple['BLOB'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'textarea',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
				'MAXLEN'  => 4095,
				'ATTRIB'  => 'rows="5"',
				'CTRL'    => "\t\r\n",
				'HTML'    => true,			// <>"' を許可
			],
_EOL_;
		$temple['VARCHAR'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
			],
_EOL_;
		$temple['CHAR'] = <<<_EOL_
			'___name___' => [
				'CLASS'   => 'string',
				'TAG'     => 'input',
				'TYPE'    => 'text',
				'DEFAULT' => ___default___,
				'TITLE'   => '___title___',
				'LESS'    => false,
			],
_EOL_;

	/*     記述例
	//@@row_form_temple NUMERIC {
				'___name___'      => [ 
					  'CLASS'   => 'string'
					, 'TAG'     => 'input'
					, 'TYPE'    => 'text'
					, 'DEFAULT' => 848635851342 
					, 'TITLE'   => '___title___'              
					, 'MAXLEN'  => 19
					, 'ACCEPT'  => '0-9'
				],
	//}@@
	*/
		$re = 
			  '`'
			. '//@@row_form_temple\s+'
			. '([A-Z0-9_]+)'				// $m[1] テンプレート名
			. '\s*{[^\n]*\n'
			. '(.*?)'						// $m[3] テンプレート
			. '//}@@[^\n]*\n'
			. '`s'
		;
		if (preg_match_all($re, $template, $m, PREG_SET_ORDER) >= 1) {		
			// テンプレートを取得
			foreach ($m as $p) {
				$temple[$p[1]] = $p[2];
			}
			
			// テンプレートを削除
			$template = preg_replace($re, '', $template);
		}

		// 行を処理
		$search = [];
		$sort   = ['' => ''];
		foreach ($table['ROWS'] as $a) {
			// SQL 読み込み
			switch ($a['name']) {
			case 'D_REGIST_DT':
			case 'D_UPDATE_DT':
			case 'V_NOTE':
				continue 2;
			}

			// デフォルトが省略されているときは ''
			if (!isset($a[11])) {
				$a[11] = '';
			}

			// この列のテンプレートを取得
			if (!empty($temple[$a['name']])) {
				// この列名専用テンプレートがある
				$tmp = rtrim($temple[$a['name']]);
			} else if (substr($a['name'], 0, 2) == 'D_') {
				// D_ ではじまるカラムは日付
				$tmp = rtrim($temple['DATE']);
			} else {
				// カラムの型ごとのテンプレ
				$tmp = rtrim($temple[$a['type']]);
			}

			// 置換
			$rep = [
				'___name___'        => $a['name'],
				'___name_suffix___' => $a['name_suffix'],
				'___default___'     => $a['default'],
				'___title___'       => $a['title'],
				'___maxlen___'      => (string)($a['size']),
			];
			
			$src[] = str_replace(array_keys($rep), array_values($rep), $tmp);
		}

		$replace['//___row_form___'] = implode("\r\n", $src);
	}

	/**
	 * オプション
	 * @var array
	 */
	public $options = [];

	/**
	 * 
	 * 
	 * @access public
	 * @param  
	 * @return 
	 * @throw  
	 */
	public function exec($argc, $argv)
	{
		// オプション取得
		$this->options = $this->procOption(array_slice($argv, 1));

		// ヘルプ表示
		if (!empty($this->options['?'])) {
			$this->usage(0);
		}

		// モード
		$mode = $this->getOption('m', 'モード');

		// 生成ファイル名(実際の出力は -out)
		$filename = $this->getOption('f', 'ファイル名');
		$ext = strrchr($filename, '.');
		$basename = basename($filename, $ext);
		$dir = dirname($filename);

		// 名前を分解
		if (strpos($basename, '_') === false) {
			// スネークケースではないのでキャメルケースとして分解
			$splitName = $this->splitCamel($basename);
			if ($splitName[count($splitName)-1] == 'base') {
				// 末尾の単語が base なら除去
				unset($splitName[count($splitName)-1]);
			}
		} else {
			$splitName = $this->splitSnake($basename);
		}

		// タイトル
		$title = $this->getOption('t');

		// 作成者名
		$author = $this->getOption('a');

		// 出力先(一時保存ファイル名)
		$output = $this->getOption('out');
		if (empty($output)) {
			$output = "php://stdout";
		} else if (file_exists($output)) {
//			exec("rm {$output}");
		}

		// SQL ファイル名
		$sqlFile = $this->getOption('sql');

		// テーブル名を作成
		$sqlBase = basename(strtoupper($sqlFile), '.SQL');
		// 先頭の数字と_を除去
		if (preg_match('/^[0-9_\s]*(.*)$/', $sqlBase, $m) === 1) {
			$sqlBase = $m[1];
		}
		if (strpos($sqlBase, '_') === false) {
			// スネークケースではないのでキャメルケースとして分解
			$tableName = $this->splitCamel($sqlBase);
		} else {
			// スネークケース
			$tableName = $this->splitSnake($sqlBase);
		}

		// モジュール名
		$moduleName = $this->getOption('module', '');
		if (empty($moduleName)) {
			// モジュール名がない
			if ($mode == 'Row') {
				// DAO ならファイル名の先頭
				$moduleName = strtoupper($splitName[0]);
			}
		}

		// テンプレートを読み込む
		$template = $this->loadTemplate($mode, $ext, $dir);

		$replace = [];

		// ファイル名を設定
		$replace['___filename___'] = basename($filename);

		// ベース名を設定(拡張子を除く)
		$replace['___basename___'] = $basename;
		$replace['___Basename___'] = $this->makeCamel($splitName);

		// 拡張子(.を含まない)
		$replace['___ext___'] = substr($ext, 1);;

		// タイトルを設定
		if (!empty($title)) {
			$replace['___title___'] = $title;
		}

		// 作成者を設定
		if (!empty($author)) {
			$replace['___author___'] = $author;
		}

		// 作成日を設定
		$replace['___date___'] = date('Y-m-d');;

		// Coryright の年を設定
		$replace['___copyright___'] = date('Y');;

		// モジュール名を設定
		$replace['___module___'] = strtolower($moduleName);
		$replace['___Module___'] = $this->toCamel($moduleName);
		$replace['___MODULE___'] = strtoupper($moduleName);
		
		// Class 名を設定
		// ファイル名にスペースを含むときはその後ろから(sql がこれに当たる)
		$i = strpos($basename, ' ');
		if ($i !== false) {
			$replace['___class___'] = substr($basename, $i + 1);
		} else {
			$replace['___class___'] = $basename;
		}

		// ___snake___ はスネークケース名
		// ※末尾の単語が Base の場合は除去される
		$replace['___snake___'] = $this->makeSnake($splitName);

		// ターゲット名を取得
		// member_edit.php -> member
		// MemberEditBase -> member
		$replace['___target___'] = $this->makeSnake(array_slice($splitName, 0, count($splitName) - 1));
		$replace['___Target___'] = $this->makeCamel(array_slice($splitName, 0, count($splitName) - 1));
		$replace['___TARGET___'] = strtoupper($replace['___target___']);

		// テーブル名(SQLファイル名から作った仮)
		$replace['___table___'] = $this->makeSnake(array_slice($tableName, 0, count($tableName) - 1));
		$replace['___Table___'] = $this->makeCamel(array_slice($tableName, 0, count($tableName) - 1));
		$replace['___TABLE___'] = strtoupper($replace['___table___']);

		// グループ名を設定
		$replace['___group___'] = $this->makeSnake(array_slice($splitName, 0, -1));
		$replace['___Group___'] = $this->makeCamel(array_slice($splitName, 0, -1));

		// DAO名
		if ($mode == 'Row') {
			$replace['___Dao___'] = $basename;
		} else {
			$a = $tableName;
			if (!empty($moduleName) && ($moduleName == $a[0])) {
				// 先頭がモジュール名と一致しないときは一旦先頭を除去
				array_shift($a);
			}
			array_unshift($a, 'Row');
			array_unshift($a, $moduleName);
			$replace['___Dao___'] = $this->makeCamel($a);
		}

		// ___lastpage___
		$a = explode('_', $basename); 
		$n = count($a) - 1;
		$iNum = 0;		// 現在のページ番号
		if (preg_match('/^([^0-9]*)([0-9]+)$/', $a[$n], $m) === 1) {
			// 末尾の語が数字で終わっている
			// 数字部があるので前のページを設定
			$a[$n] = $m[1];		// 数字より前にだけにする

			$iNum = (int)$m[2];		// 数字を取得
			if ($iNum == 1)
				$b = implode('_', $a);
			else
				$b = implode('_', $a) . ($iNum -1);

			$replace['___lastpage___'] = $b . $ext;
			$replace['___last___'    ] = $b;
		}

		// ___nextpage___
		$replace['___nextpage___'] = implode('_', $a) . ($iNum + 1) . $ext;
		$replace['___next___'] = implode('_', $a) . ($iNum + 1);

		// ベースクラスを設定
		$replace['___parent___'] = $this->makeCamel($a) . 'Base';

		// SQL(Row)処理
		if (!empty($sqlFile)) {
			// テーブル情報読み込み
			$table = $this->loadTable($sqlFile);

			// テーブル名
			$tableName = $this->splitSnake($table['NAME']);
			$replace['___table___'] = $this->makeSnake($tableName);
			$replace['___Table___'] = $this->makeCamel($tableName);
			$replace['___TABLE___'] = strtoupper($replace['___table___']);

			// SQL 文
			$replace['___sql___'] = $table['SQL'];

			// タイプ別処理
			switch ($mode) {
			case 'Row':
				$this->jobRow($replace, $table);
				break;

			case 'ListBase':
				$this->jobListBaseSQL($template, $replace, $table);
				break;

			case 'ListList':
				$this->jobListListSQL($template, $replace, $table);
				break;
				
			case 'TransBase':
				$this->jobEditBaseSQL($template, $replace, $table);
				break;
			}
		}

		// 置換
		$search = array_keys($replace);
		$replace = array_values($replace);
		$str = str_replace($search, $replace, $template);
		// 置換結果にマクロが含まれていることがあるので2回処理
		$str = str_replace($search, $replace, $str);

		// 出力
		$fp = fopen($output, 'w');
		fwrite($fp, $str);
		fclose($fp);
	}
}

// 実行
$obj = new CpssWizard();
$obj->exec($argc, $argv);
exit(0);
?>