---
title: "FennelでNeovimプラグインを書こう"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["fennel", "neovim"]
published: true
published_at: 2023-12-19 07:00
---

この記事はVimアドベントカレンダーシリーズ2 19日目の記事になります。

https://qiita.com/advent-calendar/2023/vim

## Fennelとは

Fennelとは、LuaにトランスパイルされるLisp方言です。

https://fennel-lang.org


LuaにトランスパイルできるということはNeovimで実行ができるということ、つまりNeovimプラグインが書けると考えるのは全人類共通かと思います。[^1]
というより**Neovimプラグインを漁っているときにこの言語を見つけました。**


https://github.com/ggandor/leap.nvim


Fennelで書かれたプラグインが存在するという事は、**Neovimプラグインを作成しやすくするプラグインがありそう**ですね。それがこちらです。

https://github.com/Olical/nfnl

この記事ではこのnfnlを使ってFennelでNeovimプラグインを書く方法を解説します。

ちなみに、FennelにはLSPとTreesitter向けperserが用意されているため、NeovimでMasonとTreesitterを使っている方は秒速で開発環境を用意できるはずです。

もしFennel構文が気になる方はこちらのチュートリアルが分かりやすいのでオススメです。

https://fennel-lang.org/tutorial

## Fennelのセットアップ

まず手始めにFennelのセットアップをします。FennelはLua 5.1, 5.2, 5.3, 5.4とLuaJITを必要とするので、事前にこれらをインストールします。
次にFennelをインストールします。Fennelは[単一バイナリファイル](https://fennel-lang.org/setup#downloading-a-fennel-binary)を提供しているため、これをダウンロードしてPATHを通すのが手っ取り早いです。

## nfnlのセットアップ

nfnlはNeovimプラグインですので、お好きなプラグインマネージャーでインストールしてください。僕は[dpp.vim](https://github.com/Shougo/dpp.vim)でインストールしました。

手前味噌ですがNeovimでdpp.vimをインストールする記事も書いているので、気になる方はぜひ。

https://zenn.dev/comamoca/articles/howto-setup-dpp-vim

## プラグイン作りの下準備

今回は簡単な四則演算をするプラグインを作ってみます。

次にプラグイン用のディレクトリを作成します。ここではプラグイン名を`calc.nvim`とします。

```sh
mkdir ./calc.nvim
```

次にnfnlの設定ファイルである`.nfnl.fnl`を作成します。
中は以下のように記述してください。

```lisp
{:source-file-patterns ["fnl/**/*.fnl"]}
```
次にプラグインの本体となる`./fnl`ディレクトリを作成します。

```sh
mkdir -p ./fnl/calc
```

`calc`ディレクトリの中に`init.fnl`ファイルを作成します。

```sh
touch ./fnl/calc/init.fnl
```

最後に、Neovimがプラグインを読み込めるようにruntimepathを設定します。ここではLuaでの設定方法を紹介します。

```lua: init.lua
vim.opt.runtimepath:append(vim.fn.expand("~/path/to/your/plugin/dir/calc.nvim"))
```

これで下準備は完了です。

## Fennelでプラグインを書く

まずは手始めにHello worldしてみます。ここからはLispのコードが出てきますが、以下のルールを頭に入れておけば大丈夫です。

- リテラル、関数などは全て`()`で囲う
- 関数は`(関数名 引数...)`で呼び出す
- 関数の定義は`(fn 関数名 [引数])`と書く
- 関数のexportは`{: 関数名}`と書く


それではさっそく書いていきます。

```lisp
(fn setup []
  (print "Hello")
)

{: setup}
```

コードが書けたら`:w`してプロジェクトディレクトリを`ls`してみてください。
わーお。いつの間にか`./lua/init.lua`というファイルが作成されています。

```
.
├── fnl
│   └── calc
│       └── init.fnl
└── lua
    └── calc
        └── init.lua
```

これはnfnlの機能で、`.nfnl.fnl`で指定されたファイルが保存された時は**自動的にトランスパイルして結果をNeovimが読み込める位置に配置**してくれます。
この機能があるおかげで開発体験がとても良くなっています。ありがたい...

トランスパイル結果を見てみるとこんな感じになっていると思います。

```lua
-- [nfnl] Compiled from fnl/calc/init.fnl by https://github.com/Olical/nfnl, do not edit.
local function setup()
  print("Hello")
end
return {setup = setup}
```

一般的なLuaプラグインみたいに`setup()`関数が定義されています。

それではさっそく呼び出してみましょう。

```vim
lua require("calc").setup()
```
`Hello`と表示されたら成功です。

### Neovimの機能を使ってみる

いくらLuaにトランスパイル出来てもNeovimの機能が使えないと意味がありません。
FennelはLuaにトランスパイルされる言語なので**Luaとの高い互換性を備えています**。なので、Fennelの関数を呼ぶ感覚でLuaの関数を呼び出せます。

手始めに`vim.fn.expand()`関数を呼び出してみましょう。`"~/ghq"`の箇所は任意のpathで大丈夫です。

```diff lisp
(fn setup []
  (print "Hello")
+  (print (vim.fn.expand "~/ghq"))
)

{: setup}
```

もう一度実行してみると`Hello`と`vim.fn.expand()`した結果が表示されるはずです。
このように、Fennelを使うとLispとLuaのいいとこ取りをしながらコードが書けます。

### プラグインの機能を作っていく

それでは今度はプラグインの機能を作り込んでいきましょう。とりあえず今回は空白区切りの四則演算のみ実装してみます。
先に全体のコードを貼っておきます。

:::details 全体のコード
```lisp
(fn calc [opts]
(let [
      args (vim.split opts.args " ")
      a (. args 1)
      expr (. args 2)
      b (. args 3)
	   ]
  (print (if (= expr "+")
        (+ a b)
      (= expr "-")
        (- a b)
      (= expr "*")
        (* a b)
      (= expr "/")
        (/ a b)
      )
  ))
)

(fn setup []
  (let [opt {}] opt
    (tset opt "nargs" 1)
    opt

    (vim.api.nvim_create_user_command "Calc" calc opt)
    ":ok" 
  )
)

(let [M {}]
  (tset M "setup" setup)
  M
)
```
:::


ここからはそれぞれ重要な箇所を解説していきます。

```lisp
(fn calc [opts]
(let [
      args (vim.split opts.args " ")
      a (. args 1)
      expr (. args 2)
      b (. args 3)
	   ]
  (print (if (= expr "+")
        (+ a b)
      (= expr "-")
        (- a b)
      (= expr "*")
        (* a b)
      (= expr "/")
        (/ a b)
      )
  ))
)
```

四則演算を行うメイン部分です。
`vim.api.nvim_create_user_command`のcallbackとして指定するため、引数は一つにします。
与えられた引数は`opts.args`に**文字列として格納されている**ため、`vim.split`関数を用いてsplitします。[^2]
戻り値はtableなので`.`関数を使って要素を取り出します。

これらの処理は`let`関数内で行われていて、この関数内では`let`関数の引数に指定した値(a, expr, b)を変数として使えます。

その後`if`関数を使って`expr`がそれぞれの演算子(+, -, *, /)のどれかに等しいか判定し、もしどれかに当てはまったらその計算結果を返します。
`if`関数は`print`関数に囲まれているため、結果がNeovimのコマンドラインに表示されます。

```lisp
(fn setup []
  (let [opt {}] 
    (tset opt "nargs" 1)

    (vim.api.nvim_create_user_command "Calc" calc opt)
    ":ok" 
  )
)
```

先ほどの`calc`関数をユーザーコマンドとして登録する処理です。
`nvim_create_user_command `関数は

- コマンド名
- Vim script or Luaのcallback関数
- オプション

の3つの引数を受け付けます。

このうち最後のオプションはtableで指定するため、`let`関数でスコープを作り、その中でオプションとなる`opt`変数を作成、`nargs`キーに`1`を指定しています。
`nvim_create_user_command `関数は`let`関数内に書かれているため、そのまま`opt`を引数として指定できます。

最後の":ok"ですが、これがないと`return nvim_create_user_command()`というLuaスクリプトが出力されてしまい、意図した挙動をしなくなるため追加してあります。
何らかの値なら何でも良いのですが、僕はElixirっぽく`":ok"`と書きました。


```lisp
(let [M {}]
  (tset M "setup" setup)
  M
)
```

最後のこの処理ですが、先ほどの`opt`みたいに`let`関数内でテーブルを作成し、keyとvalueをテーブルにセットしてそのテーブルを`return`しています。
この`let`関数はトップレベルにあるため、これはスクリプトレベルでの`return`となります。
Luaにトランスパイルされた結果は以下のようになります。

```lua
local M = {}
M["setup"] = setup
return M
```

見慣れたモジュールのexport処理になっています。


## 余談

Fennelという言語は前々から気になっていたのですが、**なんとZennに一つも記事がない**ためマイナー言語好きとして記事を書いてみました。
[vim-jpのSlack](https://vim-jp.org/docs/chat.html)でもちょくちょく話題に挙がったりするのでさらなる知見の蓄積に期待していきたいです。


[^1]: [元ネタ](https://zenn.dev/uochan/articles/2023-12-09-play-with-squint#vim-%E3%81%A8%E9%81%8A%E3%81%B6)
[^2]: Luaにはsplit関数が実装されていないのでとてもありがたい...
