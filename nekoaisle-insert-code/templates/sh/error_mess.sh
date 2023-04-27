# エラー表示
# @params $1 エラーメッセージ
function error_mess {
  echo -e "\e[33;1m" "$1" "\e[m"
}
