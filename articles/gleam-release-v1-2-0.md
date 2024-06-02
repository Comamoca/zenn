---
title: "Gleam v1.2.0がリリースされた話"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam]
published: true
---

Gleam v1.2.0がリリースされました！

https://x.com/gleamlang/status/1795179907942695199

詳しい内容がGleam公式サイトに書かれているので、これを元にどのような変更がされたのか紹介していきたいと思います。

https://gleam.run/news/fault-tolerant-gleam/

## v1.2.0の概要

今回のリリースでは開発者体験の向上させる変更が多く盛り込まれています。
その目玉となるのが**Gleamコンパイラの漸進的な構文解析の導入です**。

従来のGleamコンパイラは構文解析中にエラーを検出するとその時点で解析を終了しエラーを出力します。
この挙動は開発中において様々な問題を引き起こしていました。

例えば、言語サーバーにおいて解析中にエラーが発生してしまうと**その時点で解析が終了**してしまうので適切な補完などが行なえなくなります。
また、コンパイル時に1つのエラーでコンパイルが終了してしまうと、**本質的なエラーを見逃してしまう可能性**があります。

今回のリリースでこれらの問題が解消されました。
これにより開発者体験の向上が期待されています。

### LSPのimport文の補完の改善

以前もimoprt文による改善は行なえましたが、今回のリリースで非修飾importをする際にも補完が行なえます。
また、import文をホバーすると説明が表示され定義元へジャンプできるようになりました。

![](https://storage.googleapis.com/zenn-user-upload/1fedb65234ae-20240530.png)
*import文をホバーすると説明が表示される。*

![](https://storage.googleapis.com/zenn-user-upload/2065c66c833b-20240530.png)
*定義元へとジャンプできる*


### パイプラインを一行に整形

従来のGleamフォーマッターでは全てのパイプラインが複数行で整形されていましたが、**一行が短い場合に限り**一行で整形されるようになりました。
もし従来のように複数行でパイプラインを記述したい場合は改行を入れることでフォーマッターに改行を強制できます。

![](https://storage.googleapis.com/zenn-user-upload/b74584289bd2-20240530.png)
*改行前*

![](https://storage.googleapis.com/zenn-user-upload/05366b7b3d1a-20240530.png)
*改行後*

### use式のエラー メッセージの改善

GleamにはGoの**defer**やHaskellの**do**を再現できる**use**という記法があります。
この`use`は非常に強力なのですが、始めはかなり混乱を生んでいました。
さらに、従来のエラーメッセージは一般的なものしか表示できなかったため、それらの問題は悪化していました。

今回のリリースではこれらのエラーが大幅に改善されており、デバッグなどで役に立つことが期待されています。

![](https://storage.googleapis.com/zenn-user-upload/3d451285a3a5-20240530.png)
*`val`が受け取れないことを示すエラーメッセージ*

`use`について詳しく知りたい方は以下の記事を参照してください。

https://zenn.dev/comamoca/articles/gleam-use-syntax

### タイプ/値の混同に関するフィードバック

Gleamでよくある間違いとして、値と型を間違えてimportしようとするものがあります。

```rust:mytype.gleam
pub type Person {
  Person(name: String, age: Int)
}
```

```rust
import gleam/io
import mytype.{type Person} //値を使っているのに型を読み込んでいる

pub fn main() {
  let arisu = Person("arisu", 12)

  io.debug(arisu)
}
```

![](https://storage.googleapis.com/zenn-user-upload/ab39a633dea1-20240530.png)
*エラーメッセージで値と型の混同を指摘してくれる*

### アサーションの網羅性チェック

Gleamには値にパターンマッチを適用する**assert**という構文があります。
この構文はRustの**unwrap**のような挙動をする構文で、**assert**は右辺にマッチした値がある場合はその値が代入され、一致しない場合はプログラムがクラッシュします。

```rust
pub fn main() {
  let assert Ok(two) = is_even(2)
  io.debug(two)

  let assert Ok(three) = is_even(3) // Crash
  io.debug(three)
}

pub fn is_even(n: Int) -> Result(Int, String) {
  case n % 2 {
    0 -> Ok(n)
    _ -> Error("Not even")
  }
}
```

![](https://storage.googleapis.com/zenn-user-upload/58f980cfb391-20240530.png)
*let assertの箇所でプログラムがクラッシュしている*

今回のリリースでは、コンパイラにこのアサーションの網羅性のチェックを行なう変更が入りました。
これにより、全てを網羅している冗長なアサーションに対して警告が出力されます。

![](https://storage.googleapis.com/zenn-user-upload/498876379e03-20240530.png)
**冗長なアサーションに対して警告が発生している**

### todoやpanicに対する間違いの警告

Gleamには**todo**や**panic**のような構文があり、これらは実行時にエラーを発生させます。
また、これらの構文は文字列を与えることでより詳細なメッセージを出力させることが可能です。

これらの構文のよくある間違いとして、関数呼び出しのようにメッセージを指定してしまうことが挙げられます。

```rust
panic("The session is no longer valid, this should never happen!")
todo("The session is no longer valid, this should never happen!")
```
しかしこの書き方では`panic`の箇所でエラーが発生してしまうので文字列に到達できず、エラーメッセージが出力されません。

```rust
panic("The session is no longer valid, this should never happen!")
^^^^^
この箇所でエラーが発生し、処理が止まってしまう。
```

今回のリリースでは、これらのよくある間違いに対して警告を表示をする変更が入っています。
![](https://storage.googleapis.com/zenn-user-upload/88964f3889bb-20240530.png)

### 無効な定数のエラーメッセージの改善

Gleamの定数は関数などを呼び出すことができません。
これらのコードをコンパイルするとコンパイル時にエラーが発生します。

このバージョンではこれらのエラーにより分かりやすいメッセージを出力する変更が盛り込まれています。

```rust

import gleam/io
import gleam/int

const rnd = int.random(10) // 定数の右辺に関数は記述できない

pub fn main() {
  io.debug(rnd)
}
```

![](https://storage.googleapis.com/zenn-user-upload/eba57793364d-20240602.png)


### 到達不能なコードの検出

panicの後に続くコードは到達不可能であるため実行されません。
このリリースではそのようなコードに対して警告が表示されるようになりました。

```rust
import gleam/io

pub fn main () {
  panic
  io.debug("Hello") // 実行されない
}
```

![](https://storage.googleapis.com/zenn-user-upload/d3db3277585c-20240602.png)

### さらなるHex統合

GleamはErlangエコシステムの一部であるため、パッケージ管理にHexを用います。
従来のGleamコンパイラでもパッケージの公開、非公開の操作は可能でした。
今回のリリースでは**gleam revert**コマンドが追加され、最初の24時間以内に公開したリリースを非公開にできます。
また、非公開にしたあと24時間後にはパッケージのリリースが不変となり変更できなくなります。

さらに、既に公開されているパッケージを再公開しようとすると表示されるエラーメッセージが改善されました。

### Erlang モジュールの衝突防止

Erlang VMには**ホットコードローディング**と呼ばれる無停止でコードを更新できる機能が備わっています。
しかし、この機能によりGleamでモジュール名を再利用した際にアプリケーションがアップグレードされ、
存在しない関数の呼び出しによるクラッシュが発生し混乱を招く恐れがあります。

そのため、Gleamはそのような場合にエラーを返し、相互に上書きするモジュールのコンパイルを拒否してきました。
今回のリリースではそれらの対象を広げ、組み込みErlang/OTPモジュールを上書きする場合にもエラーが発生するようになりました。

### ビルドツールエラーの改善

Gleamで依存関係を管理する**manifest.toml**が無効な際に役立つエラーを表示するようになりました。

```
error: Corrupt manifest.toml

The `manifest.toml` file is corrupt.

Hint: Please run `gleam update` to fix it.
```

以前は無効な**manifest.toml**が無効な際に互換性のない全てのバージョンが表示されるというメッセージが大量に表示されていました。
これは実質的に読むことが不可能なため、今回のリリースでは単純なメッセージに置き換えられました。

### 冗長なパターン マッチングの警告

Gleamの**case**式は、複数の値のパターンマッチングをサポートしています。

```rust
case a, b {
1, 2 -> "one, two"
_, _ -> "Other"
}
```

この構文は一般的でなく、他言語に慣れている人はリストやタプルで包んで渡す可能性があります。
そのため、今回のリリースではそれらの冗長なパターンマッチに対して警告を表示するようになりました。

また、Gleam LSPは冗長なパターンマッチを自動的に修正するコードアクションを提供します。
タプル上にカーソルを置き、言語アクションを選択すると、LSPは値およびcase式のすべてのパターンからタプルを削除します。

## 今後の進展

Gleamがv1.0.0が今年の2月にリリースされてからもうv1.2.0がリリースされていて、著しい成長にびっくりしているのが正直なところです。
Gleamの公式リポジトリの[Projects](https://github.com/orgs/gleam-lang/projects)を見てみると、**GleamでSaaSを提供する計画**があったりしてワクワクしています。

とは言え、Gleamエコシステムには他の言語と比べて基礎的なライブラリがまだまだ不足していると感じることも多いです。
裏を返せば今のうちにライブラリを作って普及させれば**覇権を狙えるチャンスでもあると言えます**。
また、僕自身もライブラリを作ってGleamエコシステムに継続して貢献していきたいと考えています。

## Gleamへの寄付について

Gleamのブログやリポジトリを見ると必ず最後にスポンサーの名前が載っています。
[GitHub sponsers](https://github.com/sponsors/lpil)経由でGleamを開発しているLouis Pilfoldさんへ寄付ができるので、もしGleamのことを気に入ったのならぜひ寄付してみてください。

ちなみに自分もスポンサーをしているので名前が載っています。
![](https://storage.googleapis.com/zenn-user-upload/146bdef2eb96-20240530.png)
