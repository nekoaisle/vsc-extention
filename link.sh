#!/bin/bash
#
# タイトル
#
# filename:  link.sh
# 
# @version   1.0.0
# @copyright Copyright (C) 2019 CREANSMAERD CO.,LTD. All rights reserved.
# @date      2019-10-01
# @author    木屋 善夫
#

# コマンドをエコーして実行
# $DEBUG が TRUE のときは実行しない
# 
# @param $1 コマンド
# @param $2〜$9 引数
function _exec {
	local cmd=$1
	local res=0;
	shift
	echo -e "\e[33;1m\$ ${cmd}" "$@" "\e[m"

	if [ ! "$DEBUG" ]; then
		# $DEBUG が空なのでコマンドを実行
		$cmd "$@"
		res=$?
	fi
	return $res
}

if [ -n "${TERM}" ]; then
	SCREEN_WIDTH=$(tput cols);
else
	SCREEN_WIDTH=60;
fi
_hr(){
	local c=${1--}	# 省略時は -

	# 1. 長さ SCREEN_WIDTH の文字列を作成
	local s=''
	for ((i = 0; i < ${SCREEN_WIDTH}; i++));do
		s="$s$c"
	done
	echo $s

	# 2. 必要以上の長さになるまで倍々
	# while ((${#c} < SCREEN_WIDTH)); do
	# 	c+="$c"
	# done
	# echo "${c:0:${SCREEN_WIDTH}}"

	# 3. printf を使って作成し tr で置換
	# printf "%*s" ${SCREEN_WIDTH} | tr ' ' $c

	# 4. printf を使って作成し置換
	# local s;
	# printf -v s "%*s" ${SCREEN_WIDTH}
	# echo "${s// /${c}}"
}

function job {
	_hr =
	echo -e "\e[30;46;1m${1}\e[m"
  pushd "$1">/dev/null

	# 脆弱性解消
	# if [[ -d node_modules ]]; then
	# 	_exec npm audit fix
	# fi

	# github に追加
	# if [[ ! -e .git ]]; then
	# 	_exec git init
	# 	_exec git remote add origin "https://github.com/nekoaisle/$1.git"
	# 	_exec git add --all 
	# 	_exec git commit -a -m "最初のコミット"
	# 	_exec git fetch
	# 	_exec git push origin master
	# fi

	# .git 削除
	# _exec rm -rf .git

	# node_modules
	if [[ ! -e node_modules ]]; then
		npm install
	fi

  popd >/dev/null
  echo
	return
}

# dirs=($(find ./ -maxdepth 1 -type d -name "nekoaisle*"))
# for dir in "${dirs[@]}"; do
# 	job "$dir"

# 	# dir=`realpath "${dir}"`
# 	# name=`basename "${dir}"`
# 	# ln -s "${dir}"
# done

job nekoaisle.command-menu
job nekoaisle.cpss-decorator
job nekoaisle.cpss-wizard
job nekoaisle.disp-char-code
job nekoaisle.encode
job nekoaisle.insert-code
job nekoaisle.jump-to-line-number
job nekoaisle.mark-jump
job nekoaisle.open-file
job nekoaisle.open-filer
job nekoaisle.open-help
job nekoaisle.open-previous-tab
job nekoaisle.select-word
job nekoaisle.toggle-char-case
job nekoaisle.sjis-grep

# job nekoaisle.cpss-log-highlight
# job nekoaisle.highlight-tsv
# job nekoaisle.wz-editor-memo-file

# mod_link nekoaisle.lib