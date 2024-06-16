---
title: "GleamとJSON"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam]
published: true
---

今回はGleamでJSONをエンコード・デコードする方法を解説します。

サンプルコードはこちらに上げてあります。

https://github.com/comamoca/sandbox/tree/main/ex_gleam_json

GleamのHTTPクライアントと組み合わせて気象庁のAPIを叩いているサンプルはこちらにあります。

https://github.com/Comamoca/sandbox/blob/main/ex_gleam_httpc/

## ライブラリ

JSONを扱うライブラリはいくつかあります。

gleam_jsonはその1つです。

https://hexdocs.pm/gleam_json/

これは公式がサポートしているライブラリなのでまずはこれを使ってみると良いでしょう。

パーサーとしては公式ライブラリの他にjasperなどのライブラリがありますが、現時点(6/16)では標準ライブラリで`list.at`が削除された変更に追いつけておらず動きません。

https://hexdocs.pm/jasper/

## gleam_json

### インストール

```sh
gleam add gleam_json
```

以下のようにしてimportします。

```rust
import gleam/json
```

#### エンコード

`json.to_string`を使います。この関数は`Json`型を`String`型に変換してくれます。
ここで以下のようなJSONを作ってみます。

```json
{
  "name": "arisu",
  "age": 12,
  "favorites": {
    "food": "strawberry",
    "hobby": "game"
  }
}
```

エンコードを行うには、`Json`型の値を作成するひつようがあります。
それらを行う関数として以下のものがあり、それらを組合せてJsonを表現します。

- array
- bool
- float
- int
- null
- nullable
- object
- preprocessed_array
- string

```rust
object([
  #("name", string("arisu")),
  #("age", int(12)),
  #("favorites", object([
    #("food", string("strawberry")),
    #("hobby", string("game")),
  ])),
]) // => "{"name": "arisu","age": 12,"favorites": {"food": "strawberry","hobby": "game"}}"
```

`preprocessed_array`と`array`の違いですが、`preprocessed_array`は1つのリストに異なる型が入るのを許容し、`array`は許容しないという違いがあります。

```rust
preprocessed_array([int(1), float(2.0), string("3")])
|> to_string // "[1, 2.0, \"3\"]"

array([1, 2, 3], of: int)
|> to_string // "[1, 2, 3]"
```

#### デコード

[エンコード](#エンコード)にあるJSONをデコードしてみます。

まず事前にデコードしたいJSONと同じ構造をした型を用意します。

この型はJSONに完全に対応する必要がありません。
というのも、引数として渡す関数はそれぞれ独立して実行されるからです。

従って必要な箇所の構造のみ定義することで型定義のコストを最小限にできます。

:::message
このように**一旦値をDynamicにして`gleam/dynamic`の関数を用いて型を判別していく方法**はGleamが外部とやり取りする際によく使われます。
:::

```rust
pub type Idol {
  Idol(name: String, age: Int, favorites: Favorites)
}

pub type Favorites {
  Favorites(hobby: String, food: String)
}
```

次に、`json.decode`を使ってJSONをデコードします。

```rust
json.decode(
  text, // JSONテキストデータ
  dynamic.decode3(
    Idol,
    field(named: "name", of: string),
    field(named: "age", of: int),
    field( // 再帰的なフィールドはfieldの引数にfieldを指定すれば良い
      named: "favorites",
      of: dynamic.decode2(
        Favorites,
        field(named: "hobby", of: string),
        field(named: "food", of: string),
      ),
    ),
  ),
)
```

デコードされると`Ok(Idol("arisu", 12, Favorites("game", "strawberry")))`のように結果が`Result`に包まれて返ってきます。


## jasper

:::message
先述した通り現時点(6/16)では動作しませんが、かなり使いやすいライブラリなので紹介していきます。
:::

`gleam_json`を使った方法を見ると分かりますが、この方法は型を定義したりとかなり面倒です。
型に則ってJSONを扱いたい場合は良いですが、APIを試しに叩いてみたい時は邪魔に感じることもあると思います。

そこで構造体を定義しなくてもJSONを使えるライブラリとしてjasperを紹介します。
なおjasperは**JSONのパースのみ対応しています。**

https://hexdocs.pm/jasper/

japserはgleam_jsonより直感的な記法でJSONから値を取り出せます。

```rust
import gleam/io
import jasper.{parse_json, query_json, String, Root, Key, Index}

pub fn main() {
 let assert Ok(json) = parse_json("{ \"foo\": [1, true, \"hi\"] }")
 let assert Ok(String(str)) = query_json(json, Root |> Key("foo") |> Index(2))
 io.println(str)
}
```
[README](https://github.com/LilyRose2798/jasper)より引用。

先述のJSONから`strawberry`を取り出したい場合は、以下のように記述します。

```json
{
  "name": "arisu",
  "age": 12,
  "favorites": {
    "food": "strawberry",
    "hobby": "game"
  }
}                                                            
```

```rust
query_json(json, Root |> Key("favorites") |> Key("food"))
// => Ok("strawberry")
```


## より実用的な例

JSONを扱う処理というのは大抵の場合単体ではなく他の処理と組み合わせるケースが多いです。
そのような場合はどのように処理を記述していけば良いのか、自分の場合を混じえながら解説していきます。

### JSONの処理はモジュールとして切りだす

JSONを扱う処理というのは大抵使い回されるケースが多いです。
そこで自分は再利用性を上げるためにそれらの処理をライブラリとして切り出すケースが多いです。

```
.
├── gleam.toml
├── manifest.toml
├── README.md
├── src
│   ├── myproj.gleam
│   └── schema
│       └── idol.gleam
└── test
    └── myproj_test.gleam

4 directories, 6 files
```

```rust:idol.gleam

pub type Idol {
  Idol(name: String, age: Int)
}

/// JSON文字列をパースする関数
pub fn to_string() {
  todo
}

/// 型をJSON文字列にエンコードする関数
pub fn from_string() {
  todo
}
```

このモジュールはこんな感じで呼び出せます。

```rust
import schema/idol.{type Idol}

let arisu: Idol = idol.from_string("json文字列")

idol.to_string(Idol("haru", 12))
// => {"name": "haru", "age": 12}
```

## まとめ

今回はGleamでJSONを扱う方法を紹介しました。
Webアプリを作る上でJSONを扱う機会は多いので、この記事が参考になったら幸いです。
