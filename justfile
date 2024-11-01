open:
  $EDITOR $(ls ./articles | fzf)

new:
  read -p "slug > " -r input; zenn new:article --slug $(date '+%Y-%m-%d')-$input --title "" --type tech --emoji 🦊
  # echo $(date '+%Y-%m-%d')-$input
