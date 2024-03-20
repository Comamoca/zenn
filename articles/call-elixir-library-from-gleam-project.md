---
title: "GleamプロジェクトからElixirパッケージを呼び出してみる"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam, elixir]
published: true
---


## GleamプロジェクトからElixirパッケージを呼び出してみる

以前にこんな記事を書きました。

https://zenn.dev/comamoca/articles/interop-of-gleam-and-elixir

上記の記事では[mix_gleam](https://github.com/gleam-lang/mix_gleam)というパッケージを使い、**ElixirプロジェクトにGleamプロジェクトを作成し、GleamとElixirで相互に呼び出しあう**というものでした。
この連携方法はElixirをプロジェクトの主体として使用しているプロジェクトにおいて、コードの一部にGleamを使用する際に効果を発揮します。

例えば「Phoenixフレームワークで構築されているWebアプリのコントローラーにGleamを使用する」などが挙げられます。


この記事では**GleamプロジェクトからElixirのライブラリを呼び出す方法**を解説していきます。


## プロジェクトの用意

これは通常のプロジェクトと同じです。
今回はElixirの[Flow](https://github.com/dashbitco/flow)という並列計算ライブラリを使ってみます。

:::details Flowについて
FlowというライブラリはElixirの[GenStage](https://github.com/elixir-lang/gen_stage)というライブラリをラップするかたちで構築されています。

Flowを使うことで並列処理や分散処理を伴う計算処理をパイプとして直感的に記述できます。

FlowやGenStageのようなライブラリは他にもあって、例えば[Broadway](https://github.com/dashbitco/broadway)なんかが挙げられます。

- GenStageに関する資料は[こちら](https://elixirschool.com/ja/lessons/data_processing/genstage)
- 他のGenStageを用いたライブラリは[こちら](https://github.com/topics/genstage)

から見ることが出来ます。

:::


```
gleam new my_package
cd my_package
```

次にFlowを追加していきます。

```
gleam add flow
```

`gleam add`コマンドは[hex.pm](https://hex.pm)上にあるパッケージをインストールすることが出来ます。
このコマンドを用いてインストールされたパッケージは、Gleam以外の言語で書かれていても実行時又はビルト時に自動的にコンパイルされます。(もちろん対応している処理系は必要になります。)

## GleamからElixirライブラリの関数を呼び出してみる

ここからはGleamからFlowの関数を呼び出してみます。
始めに与えられたリストを2倍にする処理を書いてみます。

Elixirだとこうなります。
```elixir
1..1000
|> Flow.from_enumerable
|> Flow.map(fn x -> x * 2 end)
|> Enum.to_list
```

次にGleamで書いてみます。
まずFlowの関数を呼び出せるよう、`@external`を使ってFlowの関数を呼び出せるようにしてみます。

```rust
@external(erlang, "Elixir.Flow", "from_enumerable")
fn flow_from_enumerable(list: List(Int), a, Int) -> List(Int)

@external(erlang, "Elixir.Flow", "map")
fn flow_map(list: List(Int), fun: fn(a) -> Int) -> List(Int)

@external(erlang, "Elixir.Enum", "to_list")
fn elixir_enum_to_list(list: List(Int)) -> List(Int)
```

`@external`の使い方については[前回の記事](https://zenn.dev/comamoca/articles/interop-of-gleam-and-elixir#gleam%E3%81%8B%E3%82%89elixir%E3%81%AE%E3%82%B3%E3%83%BC%E3%83%89%E3%82%92%E5%91%BC%E3%81%B3%E5%87%BA%E3%81%99)を参照してください。


次に@externalの関数を呼び出してみます。
今回はgleam標準ライブラリの[iterator](https://hexdocs.pm/gleam_stdlib/gleam/iterator.html)を使ってみます。
このライブラリは遅延評価される[^1]シーケンスを定義していて、大きなリスト等を操作するのに便利です。

```rust
import gleam/io
import gleam/iterator

pub fn main() {
  iterator.range(1, 100)
  |> iterator.to_list
  |> flow_from_enumerable
  |> flow_map(fn(x) { x * 2 })
  |> elixir_enum_to_list
  |> io.debug // [2, 4, 6, ..., 200]
}
```

このように`gleam add`でパッケージを追加して`@external`で呼び出すことで、Gleamから既存のBEAMエコシステムのパッケージを呼び出すことが出来ます。

## 余談

前回の記事で外部呼び出しについてあらかた解説してしまったので、今回の記事はあっさりとした解説になりました。
Gleamのパッケージも増えてきてはいますが、まだまだライブラリの数が少ないと感じているので、適宜BEAMのエコシステムに頼ってプログラムを書いていくのがオススメです。


## 参考文献

https://qiita.com/shufo/items/59d1c3b0baac6751777f

[^1]: `gleam shell`で呼び出してみると関数オブジェクトを持っているオブジェクトが返されることからも、遅延評価していることが確認出来ます。
