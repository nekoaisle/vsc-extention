#!/bin/bash
#
# タイトル
#
# filename:  deployment.sh
# 
# @version   1.0.0
# @copyright Copyright (C) 2019 CREANSMAERD CO.,LTD. All rights reserved.
# @date      2019-10-08
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

# 使用法を表示
# 
# @params number リターンコード
# @params string エラーメッセージ(省略可)
# @return シェルスクリプトを終了するので戻りません
function usage_exit() {
  if [ "$2" ] ; then
    echo ${2}
  fi

  cat << _EOL_
usage: $ deployment.sh [host] [user]
host  default:このマシン
user  deault:cpss
_EOL_

  exit $1;
}


# オプション取得
while getopts h OPT; do
  case $OPT in
    h)  usage_exit
      ;;
    *) usage_exit
      ;;
  esac
done
shift $((OPTIND - 1))

# if [[ $# -eq 0 ]]; then
#   # 引数なしは自分へ
#   _exec rsync -av ./nekoaisl* ~/.vscode/extensions/
# else
#   # 引数あり
#   if [[ $# -eq 1 ]]; then
#     host="$1"
#     user='cpss'
#   elif [[ $# -eq 2 ]]; then
#     host="$1"
#     user="$2"
#   fi

#   _exec rsync -av ./nekoaisl* ${host}:/home/${user}/.vscode-server/extensions/
# fi

case $# in
  0)
    # 引数なしは自分へ
    _exec rsync -av ./nekoaisl* ~/.vscode/extensions/
    ;;
  1)
    # ユーザーが省略されたら cpss
    _exec rsync -av ./nekoaisl* $1:/home/cpss/.vscode-server/extensions/
    ;;
  2)
    # ホスト+ユーザー指定
    _exec rsync -av ./nekoaisl* $1:/home/$2/.vscode-server/extensions/
    ;;
  *)
    echo 'usage: $ deployment.sh [host] [user]'
    ;;
esac
