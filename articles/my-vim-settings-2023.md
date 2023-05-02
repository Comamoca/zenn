---
title: "俺のNeovim2023"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [neovim, nvim, deinvim]
published: true
publication_name: "ablaze"
---

どうもこまもかです。[^1]
今回は今年になって自分のVimの設定が大きく変わり、よりツェエエVimになったのでどの様な所が変わったのか紹介して行きたいと思います。


## 設定が全部Luaになった

![](https://storage.googleapis.com/zenn-user-upload/e5b29be655c9-20230430.png)

去年からコツコツと設定のLua化を進めていて、今年になってようやく完全Lua化を達成しました。

https://twitter.com/Comamoca_/status/1641426144200380418?s=20

Luaに変更した感想ですが、Luaに変えても起動速度はそこまで変化しませんでした。
しかしモジュールの構成方法がある程度定義[^2]されているお陰で設定の切り分けがかなり楽になりました。
また、僕はプラグインマネージャには[dein.vim](https://github.com/Shougo/dein.vim)を採用しているのですが、このプラグインがLuaにも対応したお陰でスムースに設定のLua移植が出来ました。[^3]

## 起動速度がめちゃ速くなった

```
~ via  v19.7.0
❯ vim-startuptime --vimpath nvim --count 100
Extra options: []
Measured: 100 times

Total Average: 22.932580 msec
Total Max:     37.721000 msec
Total Min:     16.169000 msec
```

Lua化とは別に、起動速度の高速化も進めていました。お陰で起動速度を平均20ms程度まで縮めることに成功しました。
この高速化の際に行った事は、

- 不要なプラグインの削除
- 遅延ロードの積極的な活用
- より高速なプラグインの採用

これらを行いました。特に遅延ロードの活用では、プラグイン間の依存関係を考慮しつつ読み込まれるタイミングを決めなければならないので、かなり苦労しました。

また、より高速なプラグインの採用ですが、init.luaに変えたこともありLua製のプラグインを積極的に採用しています。
これによる高速化は数字で比較できていませんが、体感それなりに速くなった気がします。

ちなみに、Neovimのパッケージマネージャlazy.nvimが採用している起動速度向上の技術がNeovim本体にも組み込まれていて、Luaで設定を書いているとその恩恵を受けることが出来たりします。僕が有効化した時には2msほど高速化しました。

詳しい記事はこちら
https://zenn.dev/kawarimidoll/articles/19bfc63e1c218c

## 一括読み込みの廃止

以前は[この記事](https://zenn.dev/comamoca/articles/58aa4c48f56e95)に書いてある通り起動時に一括して読み込んでいました。
しかし、一度に読み込む都合上、起動時に時間がかかってしまうという問題を抱えていました。
そこで、遅延ロードを使って設定ファルごと遅延ロードに組み込むという方法を取っています。
Luaはファイルごとに読み込ませるという事が比較的簡単に出来るので、そのメリットを存分に活かしています。

TOMLにはこのような設定を書いてプラグイン読み込み時に同時に読み込ませています。

```toml
[[plugins]]
repo = 'nvim-lualine/lualine.nvim'
on_event = ["VimEnter"]
lua_source = """
require("configs/lualine")
"""
```
読み込み先にはこのような設定が書いてあります。(長いので一部抜粋)

```lua
local lualine = require("lualine")

-- Color table for highlights
-- stylua: ignore
local colors = {
	bg       = '#202328',
	fg       = '#bbc2cf',
	yellow   = '#ECBE7B',
	cyan     = '#008080',
	darkblue = '#081633',
	green    = '#98be65',
	orange   = '#FF8800',
	violet   = '#a9a1e1',
	magenta  = '#c678dd',
	blue     = '#51afef',
	red      = '#ec5f67',
}

-- Now don't forget to initialize lualine
lualine.setup(config)

```

## Lua製プラグインの優先的採用

設定をLuaに書き換えたのだからプラグインもLuaにするべきっしょ！という事でLuaで書かれたプラグインを積極的に採用しています。
例えば、

- lightline -> lualine
- easymoation.vim -> hop.nvim
- quickrun.vim -> runit.nvim(自作)
- treesitter.nvim(ハイライト)
- nvim-web-devicons(vim-deviconsのLua版)

などです。

Luaに変更したことで反応速度がやや速くなった気が(主観)します。

## まとめ

今回は、僕のVim設定の近況について書いてきました。
Neovimの設定をLua化した事は自分のVimキャリアの中でもかなり大きな転換点になったと感じます。
今回の経験を活かして、これからもVim道を邁進して行けるように精進してまいります。では！

[^1]: ちなみにAblazeで唯一開発でVimを使っているメンバーでもあります。
[^2]: deinのTOMLファイル内に`lua_source`という要素が追加されています。この中では従来の`on_source`などと同じように、Luaでプラグインの設定を書くことができます。
[^3]: Luaのモジュールはバージョンによって色々変化しています。https://qiita.com/mod_poppo/items/ef3d8a6fe03f7f426426
