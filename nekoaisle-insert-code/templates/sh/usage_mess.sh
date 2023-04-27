# 使用法を表示
# @params number $1 リターンコード
# @params string $2 エラーメッセージ(省略可)
# @return シェルスクリプトを終了するので戻りません
function usage_mess() {
  if [ "$2" ] ; then
    echo ${2}
  fi

  echo << _EOS_
usage: $ {{pinfo.base}}
_EOS_

  exit $1;
}
