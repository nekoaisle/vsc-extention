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
usage: $ deployment.sh 
_EOL_

  exit $1;
}
