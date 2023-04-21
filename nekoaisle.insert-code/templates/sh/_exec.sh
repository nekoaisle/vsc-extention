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
