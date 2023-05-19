---
title: "1ファイルから始める自作Neovimプラグイン"
emoji: "🦊"
type: "tech"
topics: ["neovim", "tips"]
published: true
---

:::message
この記事は拙作のプラグイン`runit.nvim`を作った経験を元に書いています。
:::

https://github.com/Comamoca/runit.nvim

## ❗ 3行でまとめ
- NeovimならLuaの1ファイルだけでプラグインが作れるよ
- プラグイン化するコストが低いから設定を切り出すのにオススメだよ
- プラグインが大きくなったらヘルプを書くとユーザーにやさしいプラグインになるよ

## ✨ Vimプラグイン、作ってみたいですよね

Vimを使っているなら自作Vimプラグインに憧れますよね。
でもVimプラグインって独自のディレクトリ構造があったりでややこしかったりしますよね...

そこで今回は1ファイルからプラグインを作る方法を紹介します。


## 🚀 プラグインを作る際のポイント

Neovimにおいて`lua`というディレクトリは特殊であり、`require()`で`lua`ディレクトリのファイルを読み込むことができます。
またNeovimのプラグインは慣例的に`setup()`という関数を呼び出してNeovimに読み込ませます。

例えば自分が作った[runit.nvim](https://github.com/Comamoca/runit.nvim)の場合はこんな感じです。

```lua:runit.lua
local function matcher(ext, executors)
	local current_file = " " .. vim.fn.expand("%:t")
	return executors[ext](current_file)
end

local function runit(executors, terminal)
	if terminal == nil then
		terminal = "terminal"
	end

	vim.cmd(":vsplit")
	vim.cmd(": " .. terminal .. " " .. matcher(vim.fn.expand("%:e"), executors))
end

local function setup(terminal, executors)
	vim.api.nvim_create_user_command("RunIt", function()
		runit(terminal, executors)
	end, {})
end

return {
	setup = setup,
}
```

`setup()`内にコマンドの設定などを書いておくと、`setup()`関数が呼び出された際にコマンドの定義処理が実行されます。
もしコマンドを定義せずに、ユーザーに関数だけを公開させたい場合は以下のように書けばユーザーが`require()`して呼び出せます。

```lua:sample.lua
local function feature()
end

local function feature2()
end

return {
    feature = feature,
    feature2 = feature2
}
```
```lua
sample = require("sample.lua")

sample.feature()
sample.feature2()
```

ちなみにこの仕様を使うと、Vimの設定を小分けにすることが出来るのでファイル数が多くなってきたのが気になっている方はモジュール形式にして小分けにするのがオススメです。

例えば自分のLua設定は
```
   lua
    ├── comatools
    │   ├── init.lua
    │   ├── lazyload.lua
    │   └── scheme.lua
    └── configs
        ├── catppuccin.lua
        ├── cmds.lua
        ├── ddu-filer.lua
        ├── ddu.lua
        ├── keybind.lua
        ├── loader.lua
        ├── lspkind.lua
        ├── lualine.lua
        ├── mason.lua
        ├── null-ls.lua
        ├── nvim-cmp.lua
        ├── pounce.lua
        ├── silicon.lua
        ├── skkeleton.lua
        └── splash.lua
```

の様に自作したプラグインもどきを`comatools`に、プラグイン固有の設定などは`configs`に配置しています。
こうする事で、`init.lua`で設定ファイルを読み込むかどうかを簡単に制御することが可能です。
```lua:init.lua
require("configs/cmds")
require("configs/keybind")

-- require("configs/splash")

require("comatools/lazyload")
require("comatools/kit")
require("comatools/cloma")
```

自分のプラグインがプラグインマネージャでインストールされている様子を見るとすごくワクワクした気分になれるので、ぜひ自分のプラグインを作って公開してみてください！

また、プラグインがある程度大きくなったらREADMEやヘルプをしっかり書いていくと、使い手にもやさしいプラグインになるので積極的に書いていきましょう！

## 🍵 余談

今回は普段と違って、冒頭に記事の内容をまとめた項目を書いてみました。
今回は短めの記事でしたが、記事を読む前に概要を把握できるのと見返したときに内容を把握しやすそうなので、次からこのフォーマットで書いていっても良いかもなぁなんて思いました。

ではまた次の記事で👋。
