---
title: "GleamとElixirを相互に呼び出してみる"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam, elixir]
published: true
---

ついにGleamがversion 1に到達しました！🎉

https://gleam.run/news/gleam-version-1/

そんな訳で、今後ますます成長していくであろうGleamと今海外でアツイらしいElixirを連携させる方法を紹介していきます。

Gleamについてはこの[Gleam Language Tour](https://tour.gleam.run)が対話的になってて分かりやすいです。(英語ですが)
日本語の情報が見たい人はここらへんを参照してください。

https://zenn.dev/mzryuka/articles/start-gleam_playground

https://note.comamoca.dev/Gleam/%E9%80%86%E5%BC%95%E3%81%8DGleam.html#Elixir%E3%81%A8%E9%80%A3%E6%90%BA%E3%81%97%E3%81%9F%E3%81%84


## GleamとElixirを連携させる

:::message
この記事で紹介する方法はGleamの公式ドキュメントに書いてある方法と違う方法で行なっています。
これは自分が公式ドキュメントの方法で行なった時に上手く行かなかったからです。もし従来の方法で上手く行ったら随時更新して行きます。
ソースを確認した感じ、`mix gleam.new`でプロジェクトのテンプレートを作成出来るようにしよう、という意思はあるっぽいです。
:::


### 下準備

さて、本題のElixirの連携をしていきます。

予めGleamとElixirをインストールしておいてください。

https://gleam.run/getting-started/installing

https://elixir-lang.org/install.html

ElixirのインストールにはKiexを使うのがオススメです。

https://github.com/taylor/kiex

https://note.com/shimakaze_soft/n/n2057e7983267


まず始めにGleamプロジェクトを作成します。
ドキュメントではElixirプロジェクトを先に作成していますが、後でGleamプロジェクトも作成するのと後からGleamプロジェクトを作成すると面倒なことになるので先に作っちゃいます。

```sh
# Gleamプロジェクトを作成
# gleam new proj_nameでもOK
mkdir proj_name
gleam new .

cd proje_name

# Elixirプロジェクトを作成
# 途中既にあるREADMEを上書きするかどうか聞かれるので、適当に答えちゃってください。
mix new .
```

するとこんな感じでディレクトリが出来ていると思います。

```
.
|-- README.md
|-- _build
|-- build
|-- deps
|-- gleam.toml
|-- idols.json
|-- lib
|   `-- ex_mix_gleam.ex ←プロジェクト名によって変わる
|-- manifest.toml
|-- mix.exs
|-- mix.lock
|-- src
|   `-- ex_mix_gleam.gleam ←プロジェクト名によって変わる
`-- test
```

`lib/`と`src/`の2つのディレクトリが確認出来たら次は`mix.exs`を編集します。
mix.exsを開くとこんな感じになっていると思うので、

```elixir
defmodule Tmp.MixProject do
  use Mix.Project

  def project do
    [
      app: :tmp,
      version: "0.1.0",
      elixir: "~> 1.15",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # これより下にも設定が続く
end
```

`project`ブロック内のリスト(`[]`)の中身を以下の様に書き変えます。

```elixir
defmodule ExGleamWithFloki.MixProject do
  use Mix.Project

  @app : # プロジェクト名(projectのapp:にもともとあった文字列)

  def project do
      [
        app: @app,
        version: "0.1.0",
        elixir: "~> 1.15",
        start_permanent: Mix.env() == :prod,
        deps: deps(),
        archives: [mix_gleam: "~> 0.6.2"],
        compilers: [:gleam] ++ Mix.compilers(),
        aliases: [
          # Or add this to your aliases function
          "deps.get": ["deps.get", "gleam.deps.get"]
        ],
        erlc_paths: [
          "build/dev/erlang/#{@app}/_gleam_artefacts",
          # For Gleam < v0.25.0
          "build/dev/erlang/#{@app}/build"
        ],
        erlc_include_path: "build/dev/erlang/#{@app}/include",
        # For Elixir >= v1.15.0
        prune_code_paths: false,
        start_permanent: Mix.env() == :prod
      ]
    end

    # 他の設定はそのままにしておく

      # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:gleam_stdlib, "~> 0.36.0"}, # Gleamの標準ライブラリ
      {:gleeunit, "~> 1.0"}
    ]
  end
end
```

次に、以下のコマンドを実行してください。

```sh
mix deps.get
gleam add gleam_stdlib
```

その後に

```sh
iex -S mix
```
を実行してみてください。
恐らくElixirのシェルが起動するはずです。

### GleamからElixirのコードを呼び出す

まず始めにGleamからElixirの関数を呼び出してみます。
Gleamで外部の関数を呼び出すには`@external`キーワードを使います。


`@external`キーワードの書式は以下の通りです。

- Erlangの場合
```rust
@external(erlang,  "対象の関数が存在しているモジュール名。", "対象の関数名")
// 例
@external(erlang, "io", "format")
fn format(str: String) -> Nil
```

- Elixirの場合
```rust
@external(erlang, "対象の関数が存在しているモジュール名。必ずElixirから始める。", "対象の関数名")
// 例
@external(erlang, "Elixir.IO", "puts")
pub fn puts(strs: List(String)) -> Nil
```

- JavaScriptの場合

```rust
@external(javascript, "対象のJavaScriptファイル名")
// 例
@external(javascript, "fetch.ffi.js")
fn fetch(req: Request) -> Responce
```

@external以下の関数宣言は全て共通です。

```rust
// 関数を公開する場合はpubを付ける
pub fn 関数名(引数) -> 戻り値

fn 関数名(引数) -> 戻り値 {
// Gleam実装でフォールバックする場合はここに実装を記述
}
```


ちなみに、Gleamは`@external`に付けられた型付けを**完全に信用する**ので、不正確な型付けを行なうと**実行中にクラッシュする恐れがあります**。
必要なら[gleam/dynamic](https://hexdocs.pm/gleam_stdlib/gleam/dynamic.html)パッケージを使ってDynamic型のまま任意のタイミングで値を変換するのも手です。Dynamicについても後々記事を書きたいですね...

### ElixirからGleamのコードを呼び出す

次はElixirからGleamの関数を呼び出してみます。

- `src/`ディレクトリ内に`proj_name.gleam`
- `lib/`ディレクトリ内に`proj_name.ex`
- `Elixir`のプロジェクト名が`ProjName`

だとするとこんな感じになります。以下はFizzBuzzのサンプルコードです。

```rust:src/proj_name.gleam
import gleam/int

pub fn fizzbuzz(num: Int) -> String {
  case num % 15 {
    0 -> "FizzBuzz"
    3 | 6 | 9 | 12 -> "Fizz"
    5 | 10 -> "Buzz"
    _ -> int.to_string(num)
  }
}
```

```elixir:lib/proj_name.ex
defmodule ProjName do
  def fizzbuzz do
    Range.to_list(1..30)
    |> Enum.map(fn n -> :proj_name.fizzbuzz(n) end)
  end
end
```

`:proj_name.fizzbuzz(n)`の箇所がElixirからGleamを呼び出している所です。
実はこれ、**ElixirからErlangを呼び出す方法と同じです。**
というのも、mix_gleamはGleamプログラムを一旦Erlangプログラムに変換しているからです。[^1]
なので、Elixirから見たGleamファイルは実質Erlangプログラムだったりします。[^2] 

また、この方法で`gleam shell`で実行されるErlang Shellからプログラムの関数を直接呼び出せたりします。

```erlang:erl
> io:format(proj_name:fizzbuzz(1)).
1ok
```

### Gleamプロジェクトに依存を追加したい

[下準備](#下準備)でElixirプロジェクトとGleamプロジェクトの両方に`gleam_stdlib`を追加したように、
Gleamプロジェクトに新たな依存を追加するとElixirプロジェクト側にも追加する必要が出てきます。(地味に面倒なのでなんとかしたい)

最後に、ElixirのFlokiを使ってGleamでHacker Newsのヘッドラインを取得するサンプルを書いたのでぜひ参考にしてください。
下のツイートにも書いてありますが、GleamでHTMLをパースするライブラリはすでにあるのでただGleamでHTMLをパースしたい人はそちらを使ったほうが良いと思います。

https://github.com/lpil/htmgrrrl

https://x.com/Comamoca_/status/1766579872539779218?s=20

https://github.com/Comamoca/sandbox/tree/main/ex_gleam_with_floki


[^1]: なのでErlangの知識がある方はコードを書いた後`/build`ディレクトリを覗いてみると面白いです。デバッグにも役立ちます。
[^2]: とは言ってもElixirの文字列をそのまま渡せたりと、従来のErlangの関数よりかは扱いやすいです。
