---
title: "Gleam 1.3.0で開発体験が更に向上した"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam]
published: true
---

Gleam 1.3.0がリリースされました。

https://x.com/gleamlang/status/1810668807964537272

今回のリリースも1.2.0と引き続き開発体験の向上に関する変更が盛りこまれています。
v1.2.0に続いてリリースノートの内容を紹介していきます。

https://zenn.dev/comamoca/articles/gleam-release-v1-2-0

## Gleam v1.3.0の新機能

- [import文の自動挿入](#import文の自動挿入)
- [文レベルの漸進的な解析](#文レベルの漸進的な解析)
- [LSPサーバーの挙動を均一化](#lspサーバーの挙動を均一化)
- [importサイクルの診断](#importサイクルの診断)
- [hover機能の拡充](#hover機能の拡充)
- [冗長なタプルとコードアクション](#冗長なタプルとコードアクション)
- [`gleam add`コマンドでバージョンを指定可能に](#gleam-addコマンドでバージョンを指定可能に)
- [構文の警告とエラーの改善](#構文の警告とエラーの改善)
  - [冗長な関数キャプチャ](#冗長な関数キャプチャ)
  - [ガード式でスプレッドを使用した際のエラーメッセージの改善](#ガード式でスプレッドを使用した際のエラーメッセージの改善)
  - [カンマなしでのスプレッド構文の使用した際のメッセージの改善](#カンマなしでのスプレッド構文の使用した際のメッセージの改善)
  - [変数名に予約語を使用した際のエラーメッセージの改善](#変数名に予約語を使用した際のエラーメッセージの改善)
- [OTP 27で導入されたキーワードをエスケープ](#otp-27で導入されたキーワードをエスケープ)
- [JavaScriptターゲットで非整数ビット配列が指定された際のコンパイルエラー](#javascriptターゲットで非整数ビット配列が指定された際のコンパイルエラー)
- [算術ガード](#算術ガード)
- [JavaScriptバンドラーのへのヒントの出力](#javascriptバンドラーのへのヒントの出力)

## import文の自動挿入

![](https://storage.googleapis.com/zenn-user-upload/9ed7b013324d-20240723.gif)

Go言語の言語サーバーgoplsなどには、自動でimport文を挿入してくれるAuto-import機能があります。
今回のGleam v1.3.0ではGleamの内蔵言語サーバーにこのAuto-import機能が追加されました。


## 文レベルの漸進的な解析

Gleam 1.2.0にてモジュールレベルの漸進的な解析が組込まれましたが、今回のリリースではそれが文レベルの粒度にアップデートされました。
これにより、エラーのある文においてもLSPによるサポートを受けられます。

## LSPサーバーの挙動を均一化

LSPの仕様には実装依存なものがあり、テキストエディターごとに異なる挙動をすることがあります。
今回のリリースではすべてのテキストエディターで一貫した挙動をするよう改善されました。さらに、コメント内で補完が提供されなくなりました。

## importサイクルの診断

LSPには、サーバーがメッセージをクライアントに送信してユーザーに表示する方法があります。
比較的新しいエディタはまだこのAPIをサポートしていないため、この方法で送信されたエラーは表示されません。

import cycleに関するエラーはこれらの問題を引き起す問題のひとつです。
Gleam 1.3.0ではこれらの原因となるエラーをすべてのimport文の場所に付加されるよう変更されました。

これにより、更に多くの機能のサポートが期待できます。

## hover機能の拡充

Gleamには、パターンマッチングの際に興味のないレコードフィールドを無視するための構文があります。

```rust
import gleam/io

type Person {
  Person(name: String, age: Int)
}

pub fn main() {
  let mike = Person(name: "mike", age: 12)
  let jack = Person(name: "jack", age: 9)

  sub(jack) |> io.println // Hi jack!
  sub(mike) |> io.println // your age is 9.
}

fn sub(person: Person) -> String {
  case person {
    Person(name: "jack", ..) -> "Hi jack!"
    Person(age: 12, ..) -> "your age is 9."
    Person(name: name, ..) -> "Hello " <> name
  }
}
```
Gleam 1.3.0では`..`の部分をhoverすると残りのフィールドが表示されるようになりました。
これにより、残りのフィールドをパターンマッチに容易に追加できるようになることが期待できます。

![](https://storage.googleapis.com/zenn-user-upload/5505521c5b92-20240723.png)

## 冗長なタプルとコードアクション

![](https://storage.googleapis.com/zenn-user-upload/ce480c65559d-20240723.gif)

Gleamではタプルに包まずとも複数の値のパターンマッチを行なえます。
Gleam 1.2.0ではタプルに包まれた冗長なパターンマッチに対する警告が表示されるようになりました。

Gleam 1.3.0ではそれら冗長なタプルが使われた際に修正するCoce Actionが追加されました。
これにより冗長なタプルを一発で削除できるようになりました。

```rust
import gleam/io

pub fn main() {
  let a = 1
  let b = 2

  case #(a, b) {
    #(1, 2) -> "1, 2"
    _ -> "notthing"
  }
  |> io.println
}
```

## `gleam add`コマンドでバージョンを指定可能に

Gleamでは依存を追加する際に`gleam.toml`ファイルを編集する方法と`gleam add`コマンドを使用する方法があります。
`gleam add`コマンドは手軽に依存を追加できます。しかし今まではバージョンを指定できなかったため、バージョンの指定は`gleam.toml`で行う必要がありました。

Gleam 1.3.0では`gleam add lustre@1.2.3`のように依存のバージョンを指定して依存を追加できるようになりました。
これにより、これまでより簡単に依存を追加できるようになることが期待できます。

## 構文の警告とエラーの改善

Gleam 1.3.0ではいくつかの構文の警告とエラーの改善が加えられました。

### 冗長な関数キャプチャ

Gleam 1.3.0からパイプライン内の冗長な関数キャプチャに対して警告を発するようになりました。

```rust
import gleam/int

pub fn main() {
  1
  |> int.add(_, 2) // パイプラインで一つ目の引数は`1`で確定してるため、`_`は冗長
}
```

```
❯ gleam run
  Compiling tmp

warning: Redundant function capture
  ┌─ /tmp/tmp.w5Hc6de1YS/tmp/src/tmp.gleam:5:14
  │
5 │   |> int.add(_, 2)
  │              ^ You can safely remove this

This function capture is redundant since the value is already piped as the
first argument of this call.
```

### ガード式でスプレッドを使用した際のエラーメッセージの改善

Gleamではパフォーマンスの面からガード式の先頭要素に配列のスプレッドが使えません。
Gleam 1.3.0ではこれらのコンパイルエラーに関する丁寧なエラー文が追加されました。

```rust
import gleam/int
import gleam/io
import gleam/list

pub fn main() {
  let fib = [1, 1, 2, 3]

  case list.range(1, 10) {
    [..fib, 5] -> "First 5 item is fibonacci" // パターンマッチの先頭に配列のスプレッドは指定できない。
    [1, 2, 3]-> "One, Two, Three"
  }
}
```
```
❯ gleam run
error: Syntax error
  ┌─ /tmp/tmp.w5Hc6de1YS/tmp/src/tmp.gleam:9:6
  │
9 │     [..fib, 5] -> "First 5 item is fibonacci"
  │      ^^^^^ I wasn't expecting elements after this

Lists are immutable and singly-linked, so to match on the end
of a list would require the whole list to be traversed. This
would be slow, so there is no built-in syntax for it. Pattern
match on the start of the list instead.
```
エラー文の邦訳は以下になります。

> リストは不変であり、単一リンクであるため、リストの末尾でマッチするためにはリスト全体を走査する必要があります。
> これは遅いので、組み込みの構文はありません。
> 代わりにリストの先頭でパターンマッチをしてください。

### カンマなしでのスプレッド構文の使用した際のメッセージの改善

カンマなしでのスプレッド(`[a..b]`)は非推奨となり、`[a, ..b]`構文が推奨されます。

これは、Gleamにはない範囲構文と間違われるのを避けるためです。
この仕様はGleamコンパイラー開発者によるミスで、Gleam 2.0.0がリリースされる時に修正される予定です。

### 変数名に予約語を使用した際のエラーメッセージの改善

予期しないトークンのエラーメッセージを改善し、より多くの情報が含まれるようになりました。
この変更により、キーワードを変数名として使おうとした時に何が問題であるか分かりやすくなりました。

```rust
pub fn main() {
  let type = 2 // `type`は予約語なため使うことができない。
}
```

```
❯ gleam run
error: Syntax error
  ┌─ /tmp/tmp.w5Hc6de1YS/tmp/src/tmp.gleam:6:7
  │
6 │   let type = 2 
  │       ^^^^ I was not expecting this

Found the keyword `type`, expected one of: 
- A pattern
```

## OTP 27で導入されたキーワードをエスケープ

Erlang/OTP 27では、`Maybe`と`else`という2つの新しいキーワードがErlangに導入されました。
Gleam 1.3.0では新しいErlang構文と衝突する可能性のある関数、型、およびレコードコンストラクターを適切にエスケープされました。

これによりGleamをOTP 27を実行する際の安全性が向上しました。

## JavaScriptターゲットで非整数ビット配列が指定された際のコンパイルエラー

JavaScriptで実行する場合、Gleamのビット配列には整数のバイトが含まれている必要があります。
他のビット数で構築しようとすると実行時エラーになります。
また、ビット配列のsizeオプションに直接値を指定している場合、コンパイルエラーが発生します。

なお将来的にこの制限は解除される予定です。

```rust
import gleam/io

const five = 5

pub fn main() {
  let return_five = fn() { 5 }

  let byte = <<1:size(return_five())>> // コンパイル時に検出できないため実行時エラーになる

  io.debug(byte)
}
```

```
❯ gleam run --target javascript
   Compiled in 0.00s
    Running tmp.main
file:///tmp/tmp.w5Hc6de1YS/tmp/build/dev/javascript/prelude.mjs:166
    throw new globalThis.Error(msg);
          ^

Error: Bit arrays must be byte aligned on JavaScript, got size of 5 bits
    at sizedInt (file:///tmp/tmp.w5Hc6de1YS/tmp/build/dev/javascript/prelude.mjs:166:11)
    at main (file:///tmp/tmp.w5Hc6de1YS/tmp/build/dev/javascript/tmp/tmp.mjs:6:26)
    at file:///tmp/tmp.w5Hc6de1YS/tmp/build/dev/javascript/tmp/gleam.main.mjs:2:1
    at ModuleJob.run (node:internal/modules/esm/module_job:262:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:485:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:109:5)

Node.js v22.5.0
```

定数を指定している場合、コンパイル時にエラーが発生します。

```rust
import gleam/io

pub fn main() {
  let byte = <<1:size(5)>>

  io.debug(byte)
}
```

```
❯ gleam run --target javascript
  Compiling tmp
error: Unsupported feature for compilation target
  ┌─ /tmp/tmp.w5Hc6de1YS/tmp/src/tmp.gleam:4:16
  │
4 │   let byte = <<1:size(5)>>
  │                ^^^^^^^^^

Non byte aligned array is not supported for JavaScript compilation.
```

## 算術ガード

Erlang VMはcase句ガード式の限られたサブセットのみをサポートし、Gleamはこの制限を継承します。
Gleam 1.3.0では、floatとintの算術演算をcase句のガードでもサポートするようになりました。

```rust
import gleam/io

pub fn main() {
  match(0, 0) |> io.debug // -> "All zero"
  match(1, 2) |> io.debug // -> "None"
}

fn match(a: Int, b: Int) {
  case a, b {
    a, b if a + b == 0 -> "All zero"
    _, _ -> "None"
  }
}
```

## JavaScriptバンドラーのへのヒントの出力

GleamをJavaScriptにコンパイルする場合、esbuildやViteなどのJavaScriptバンドラーを使用して1つのファイルに結合する場合があります。
これらのバンドラーはGleamコンパイラほどコードに詳しくないため、一部の関数を削除できるかどうか判断できない場合があります。

Gleam 1.3.0からGleamは、JavaScriptを出力する際に`/*@__PURE__*/`アノテーションを純粋な関数に付加します。
バンドラーはこれを使用してより積極的な削除ができるようになります。

## Gleamへの寄付について

Gleamのブログやリポジトリを見ると必ず最後にスポンサーの名前が載っています。
[GitHub sponsors](https://github.com/sponsors/lpil)経由でGleamを開発しているLouis Pilfoldさんへ寄付ができるので、もしGleamのことを気に入ったのならぜひ寄付してみてください。
