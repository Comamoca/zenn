---
title: "Gleam v1.4.0がリリースされた話"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam]
published: true
---

Gleam 1.4.0がリリースされました。[^1]

https://x.com/gleamlang/status/1819420684311056746

今回のリリースはこれまでのリリースとは打って変わってラベルまわりの構文の改善が盛り込まれています。
v1.3.0に続いてリリースノートの内容を紹介していきます。

https://zenn.dev/comamoca/articles/2024-07-14-gleam-release-v1-3-0

Gleam公式のリリースノートは以下のリンクから見られます。

https://gleam.run/news/supercharged-labels

## Gleam v1.4.0の新機能

- [ラベルの短縮構文](#ラベルの短縮構文)
  - [コードアクション](#コードアクション)
  - [フィールドの補完機能の追加](#フィールドの補完機能の追加)
- [シグネチャのヘルプ](#シグネチャのヘルプ)
- [確実な警告の出力](#確実な警告の出力)
- [ターゲット毎のドキュメント生成](#ターゲット毎のドキュメント生成)
- [耐障害性の更なる向上](#耐障害性の更なる向上)
- [よくある型定義の間違いに関するヘルプ](#よくある型定義の間違いに関するヘルプ)
- [定数における文字列の連結をサポート](#定数における文字列の連結をサポート)
- [JavaScriptターゲットにおけるビット配列の更なる機能追加](#javascriptターゲットにおけるビット配列の更なる機能追加)
- [Document symbolsのサポート](#document-symbolsのサポート)
- [他のコードアクションの追加](#他のコードアクションの追加)
  - [大文字と小文字の修正](#大文字と小文字の修正)
  - [let assertからcaseへの修正](#let-assertからcaseへの修正)
- [Gleamへの寄付のお願い](#gleamへの寄付のお願い)

## ラベルの短縮構文

Gleamにはラベル付き引数という他の言語で**キーワード引数**に近い構文があります。

```rust
import gleam/io

pub fn main() {
  let name = "Gleam"
  greet(name: name)
  |> io.println // Hello! Gleam!
}

fn greet(name name: String) -> String {
  "Hello! " <> name <> "!"
}
```

Gleamでは変数名と同じ名前のラベルに値を渡すことがよくあります。
Gleam 1.4.0からは同じ名前の変数があった場合ラベルへの変数の割り当てを省略できる記法が導入されました。

この記法を使うと上述のプログラムは以下のように書けます。

```rust
import gleam/io

pub fn main() {
  let name = "Gleam"
  greet(name:,)
  |> io.println
}

fn greet(name name: String) -> String {
  "Hello! " <> name <> "!"
}
```

これらの構文はカスタム型のレコードやパターンマッチでも適用されます。

```rust
// カスタム型の例
import gleam/io

pub type Idol {
  Idol(name: String, age: Int)
}

pub fn main() {
  let name = "arisu"
  let age = 12
  let idol = Idol(name:, age:)  

  io.debug(idol.name)
  io.debug(idol.age)
}
```


```rust
// パターンマッチの例
import gleam/io

pub type Idol {
  Idol(name: String, age: Int)
}

pub fn main() {
  let arisu = Idol(name: "arisu", age: 12)
  // レコードの要素にアクセスせずとも変数として扱える
  let Idol(name:, ..) = arisu

  io.println(name)
}
```

### コードアクション

今回リリースされた短縮構文へと変換できるコードアクションがいくつか追加されています。

![](https://storage.googleapis.com/zenn-user-upload/7fc1f0c29595-20240809.gif)
*レコードのラベルを短縮記法に変換するコードアクション*

![](https://storage.googleapis.com/zenn-user-upload/103de537a5c6-20240809.gif)
*レコードのラベルを全て埋めるコードアクション*


### フィールドの補完機能の追加

Gleam 1.4.0ではラベル付きレコードの後に`.`を入力することでアクセスできるフィールドが補完される機能が追加されました。

![](https://storage.googleapis.com/zenn-user-upload/6ffdae3f8ea7-20240809.gif)


## シグネチャのヘルプ

関数やレコードを記述する際、引数を提案する機能が追加されました。

![](https://storage.googleapis.com/zenn-user-upload/b7cea9787014-20240809.gif)

## 確実な警告の出力

Gleamビルドツールは漸進的コンパイルを実装しているため、**モジュールの定義が変更された場合にのみモジュールが再コンパイルされます**。
これによりGleamのコンパイル速度を高速化しています。

しかし、モジュールのコンパイル中に警告が発生した場合でもそのモジュールが編集されない限り警告はキャッシュされるため、
その後のコンパイルで警告が表示されないという問題がありました。

今回のリリースでビルドされるたびに警告が発行されるようになりました。これにより警告の見落とし防止が期待できます。

## ターゲット毎のドキュメント生成

`gleam docs build`はオプションの`--target`フラグを使用して、生成されるドキュメントのターゲットプラットフォームを指定できるようになりました。
この機能は基本的に使用されませんが、非推奨の条件付きコンパイル機能を使用する場合に役立つ可能性があります。

## 耐障害性の更なる向上

Gleamのコンパイラは耐障害分析を実装しています。
これにより分析中にエラーが発生してもコンパイラーは無効な部分を無視し、可能な限りコードの分析を続行できます。
このためGleam LSPはコードを十分に理解し、コードベースが無効な状態にある場合でもその機能を提供できます。

今回のリリースではこの機能が更に改善しされ、レコードアクセスや関数呼び出し関連のエラーが存在する場合でもコンパイラがより多くの情報を保持するようになりました。
これによりテキストエディターでの開発体験が向上しました。

## よくある型定義の間違いに関するヘルプ

Gleamでは型を定義するために以下のような形式を用います。

```rust
pub type Idol {
  Idol(name: String, age: Int)
}
```

これは他の言語のクラス構文によく似ていて、C形式の構造体定義によく間違われます。
しかし以下のプログラムはコンパイルできません。

```rust
pub type Idol {
  name: String,
  age: Int
}
```

今回のリリースで、これらの間違いを指摘し正しい構文と問題の解決方法が表示されるようになりました。

```
error: Syntax error
  ┌─ /tmp/tmp.iMs3Q8lDAG/tmp/src/tmp.gleam:6:3
  │
6 │   name: String,
  │   ^^^^ I was not expecting this

Each custom type variant must have a constructor:

pub type Idol {
  Idol(
    name: String,
  )
}
```

## 定数における文字列の連結をサポート

文字列を連結する演算子`<>`を定数式で使用できるようになりました。

```rust
pub const hello = "Hello"
pub const world = "world"

pub const hello_world = hello <> ", " <> world
```

## JavaScriptターゲットにおけるビット配列の更なる機能追加

Gleamには、ビット配列を扱うためのリテラル構文があり、ビット単位の演算を使用する便利で理解しやすい手段を提供します。
しかし、現在ErlangターゲットでサポートされているすべてのオプションがJavaScriptターゲットでサポートされているわけではありません。

今回のリリースでは以下の機能が追加されました。

- リトルエンディアンとビッグエンディアン
- signed及びunsignedint
- 32ビットと64ビットサイズのfloat
- UTF-8オプション

## Document symbolsのサポート

言語サーバーは現在のGleamファイルの関数や定数などのドキュメントシンボルのリストをサポートするようになりました。
これをエディタで使用すると、モジュールの概要を把握したり、大きなファイル内を移動したりするのに役立ちます。

![](https://storage.googleapis.com/zenn-user-upload/722eb4e77154-20240810.gif)

## 他のコードアクションの追加

今回のリリースではレコードの短縮構文のコードアクションの他に、以下のコードアクションが追加されています。

### 大文字と小文字の修正

Gleamは**変数と関数にスネークケース**を使用し、**型とレコードコンストラクターにパスカルケース**を使用します。
これらを混同するとコンパイルエラーになるため、命名のスタイルについて議論する必要がなくなっています。

今回のリリースから誤って間違ったスタイルを使用した場合にLSPがこれらの命名スタイルの修正を提案するようになりました。

![](https://storage.googleapis.com/zenn-user-upload/4e72c8df4655-20240810.gif)

### let assertからcaseへの修正

今回のリリースでは`let assert`式を意味的に同等なcaseおよびPanic式に変換するコードアクションが追加されました。

![](https://storage.googleapis.com/zenn-user-upload/0ab0329222cb-20240810.gif)


## Gleamへの寄付のお願い

Gleamは現状企業のスポンサーが付いておらず、個々人の支援によって支えられています。
またGleamを開発しているLouis Pilfoldさんは、Gleamをフルタイムで開発するため、現在企業に勤めていません。
そのため寄付金は貴重な収入源なのですが、現状の目標値の3割程度しか集まっておらず厳しい状況が続いています。

![](https://storage.googleapis.com/zenn-user-upload/941a8e4a39f7-20240809.png)
[GitHub sponsors](https://github.com/sponsors/lpil)経由でGleamを開発しているLouis Pilfoldさんへ寄付ができるので、もしGleamのことを気に入ったのならぜひ寄付してみてください。

[^1]: 前回の記事を書いたのが2週間ちょっと前だったのですが、もう新しいバージョンがリリースされていてビックリしてます。
