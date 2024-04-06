---
title: "Gleamのopaque(不透明型)について"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam]
published: true
---

今回はGleamの`opaque`(以下不透明型)について解説します。

透明型とは、**外部から認識はできるものの、呼び出し元からは直接アクセスできない型**を表します。
もっと言うと、**プリミティブな型に任意の制限を課すことができる型**になります。

この機能を使うとメールアドレスなど**形式が決っている文字列や数値などを型として定義**したりできます。

TSだとテンプレートリテラル型が近そうです。(そこまで詳しくないのでまちがっているかもしれません)

## まずは普通に型を定義してみる

Gleamは`Custom types`という機能でユーザーが独自の型を作成できます。

:::message
書き方が他の言語と若干違うので気を付けてください。
:::

例えば、**偶数を定義した型**について考えてみましょう。
まずはopaqueを使わずに書いてみます。

```rust
import gleam/io

pub type Even {
  Even(n: Int)
}

pub fn main() {
  let _ = even()
}

fn even() {
  Even(2) |> io.debug // Even(2)
}
```
これは見た感じ良さそうですが、大きな問題を抱えています。
**偶数じゃない値も入れられるのです。**

```rust
Even(5) |> io.debug // Even(5)
```

[Playground](https://johndoneth.github.io/gleam-playground/?s=JYWwDg9gTgLgBAcwDYFMCGID0wIChdgCuARnDAJ5gpwCiAbigHZwDeuctDjAFIwFxwAkoxgBKXAF98RUgDNmINMB6jW7OKngB9OAF44KLt3FTc8g0dVsO9JtwBMqgD4A%2BODgB0AExTFCCdVseAFZnN08fPwCJIA%3D)

偶数を想定した型に奇数が入っているとバグの原因になってしまいそうです。
どうにか**値が正しいかどうか作成時に判断できると良さそう**です。


## opaqueを使ってみる

その前にGleamにおけるモジュールの可視性について簡単に説明します。

Gleamではファイル単位でモジュールを作ることができます。
モジュールで定義した型や関数は定義時に`pub`キーワードで外部からアクセスすることを許可できます。

```rust:mod.gleam
pub type PubType {
  PublicType
}

type NonPubType {
  NonPublicType
}
```

```rust:main.gleam
import gleam/io
import mod

pub fn main() {
  let p = mod.PublicType
  let np = mod.NonPubType // mainからはアクセスできない
}
```


## opaqueでIntに制約を付ける

以下は`opaque`を使い、`Even`という偶数を定義したモジュールからその型を使う例です。
失敗する可能性がある型の生成結果は`Result`を用いることで表現できます。


```rust:main.gleam
pub fn main() {
  even.from_int(8)
  |> io.debug // Ok(Even(8))

  even.from_int(5)
  |> io.debug // Error(5)

  even.Even(2)
  |> io.debug // 直接アクセスできない
}
```

```rust:even.gleam
pub opaque type Even {
  Even(num: Int)
}

/// 値が偶数でない場合は与えられた数値をErrorで包んで返す
pub fn from_int(n: Int) -> Result(Even, Int) {
  case n % 2 {
    0 -> Ok(Even(n))
    _ -> Error(n)
  }
}

pub fn to_int(n: Even) -> Int {
  n.num
}
```

## opaqueの使い道

opaqueを使うとプリミティブな型に任意の制限をかけられるので、型レベルプログラミングに近いことが可能になります。
以下はGleamでFizzbuzzを`Fizz` `Buzz` `N`という3つの型の`List`であると定義しています。

https://x.com/Comamoca_/status/1775907834276020266

もっと実用的な例として、**メールアドレスのバリデーション**などが挙げられます。


```rust:mail_address.gleam   
import gleam/regex

pub opaque type EmailAddress {
  EmailAddress(address: String)
}


// この関数を呼びださないとEmailAddress型を作れない
pub fn from_string(str: String) -> Result(EmailAddress, String) {
  let assert Ok(re) =
    "^[a-zA-Z0-9_+-]+(.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.)+[a-zA-Z]{2,}$"
    |> regex.from_string

  case regex.check(re, str) {
    True -> Ok(EmailAddress(str))
    False -> Error("Cant convert EmailAddress.")
  }
}
```

```rust:main.gleam
import gleam/io
import mail_address

pub fn main() {
  // 文字列がメールアドレスであると型レベルで証明できる
  let assert Ok(address) = mail_address.from_string("gleam-sample@example.com")

  address
  |> io.debug
}
```
