<?php /* nekoaisle.insert-code delete line */
/* nekoaisle.insert-code delete line */
/**
 * コマンド処理マップを返す。
 * 
 * ※必要に応じて派生クラスで実装してください
 * return array コマンドマップ
 *	1.	[[name] => [handler]);
 *		[name]    <input> タグの name属性の値
 *		[handler] 処理関数名 blHandler($_REQUEST[$strKey]);
 *			リクエストの内容を引数として呼び出します
 *			戻り値が SUCCEEDED だった場合ディスパッチ処理を終了します
 *	2.	[[name] => [
 *			'HANDLER'    => [handler]
 *			'PERMISSION' => [permission]
 *		);
 *		[permission] 権利定数 PERMISSION_READ | PERMISSION_MODIFY | PERMISSION_DELETE
 * 
 * @access public
 * @return array [ ボタン名 => 処理関数名 ]
 * @author {{author}}
 */
protected function aryGetFormCommandMap()
{
	// 配列に定義した順に処理されます。
	return [
		'SUBMIT' => 'onSubmit',
		$1
	];
}
/* nekoaisle.insert-code delete line */ ?>