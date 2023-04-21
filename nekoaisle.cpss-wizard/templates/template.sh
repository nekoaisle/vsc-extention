#!/bin/bash
# 
# ___title___
#
# filename:  ___filename___
# 
# @version   0.1.1
# @copyright Copyright (C) ___copyright___ ___author___ All rights reserved.
# @date	  ___date___
# @author	___author___
# 

# 使用法を表示
# 
# @params number リターンコード
# @params string エラーメッセージ(省略可)
# @return シェルスクリプトを終了するので戻りません
function help() {
	if [ "$2" ] ; then
		echo ${2}
	fi

	echo 'usage: $ ___filename___ '

	exit $1;
}

# 引数が指定されなかったときはエラー
if [ $# -eq 0 ]; then
	help 0;
fi

# グローバル変数
