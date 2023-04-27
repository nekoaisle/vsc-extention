<?php /* nekoaisle.insert-code delete line */
/**
 * [GET_$1] 選択肢を取得するAJAX処理
 * 
 * @access public
 * @param  string \$val 
 * @return boolean コマンドディスパッチを FAILED:継続 SUCCEEDED:終了
 * @author {{author}}
 * @throw  
 */
public function onGet$1(\$val)
{
	// AJAX なので HTML は出力しない
	\$this->m_blUseHTML = FALSE;
	// 戻り値用配列
	\$data = [];
	// json を出力
	\$this->EchoJSON(\$data);
	//
	return SUCCEEDED;
}
/* nekoaisle.insert-code delete line */ ?>