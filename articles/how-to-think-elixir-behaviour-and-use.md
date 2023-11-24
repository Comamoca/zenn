---
title: "【Elixir】behaviourとUseの考え方"
emoji: "🦊" 
type: "tech" # tech:技術記事 / idea: アイデア
topics: ["elixir"]
published: false
---

## Elixirのbehaviourを理解するのに手こずった

Elixirにはモジュールを使うユーザーに任意の実装を強制できる**behaviour**というしくみがある。
これを理解するのに結構手こずったので、備忘録がてら自分の中での理解を書いていきたい。

## useは関係ない
関係ない…は言い過ぎかもしれないけど、`use`がなくてもbehaviour自体は成立する。ただ、behaviourと相性が良いので合わせて使われるケースが多い。これはまた後で解説する。

## なぜbehaviourが必要なのか
Bhaviorのしくみを理解するにはbehaviourが必要な理由から考えると分かりやすい。

たとえばこんな感じのモジュールがあるとする。

```elixir
defmodule Person do
  def greet(name) do
  IO.puts("Hi! #{name}")
  end
end
```

Elixirではモジュールを別のモジュールから呼び出すことが可能で、その際呼び出したモジュールが持っている関数を呼び出すことができる。
```elixir
# iex
iex(1)> Person.greet "Your name"
> Hi! Your name
```
さて、今`Person.greet`を呼び出したけれど、これを行うには**呼び出したい関数が存在している事を確認する必要がある**。
もし該当の関数がなかった場合はもちろんエラーが発生する。 

ここまで対象のモジュールをiexでインタラクティブに呼び出していた。しかし実際はプログラム中で呼び出される事が多い。
先述したように、対象のモジュールに呼び出したい関数が実装されている事を保証する何らかのしくみがないと、プログラムを実行中に思わぬエラーが発生するかもしれない。

それを防ぐためのしくみがまさにbehaviourの目的と言える。

## behaviourとダックタイピング
なぜこのようなことが起きてしまうのだろうか。それは**Elixirが動的型付き言語だから**。

動的型付き言語では、オブジェクト自身が型を持っているため関数などで与えられた値に対して無条件でメソッドを発動できる。

```js
function show_length(obj){
  console.log(obj.length)
}
```
この関数は文字列とリストが来たときはlengthの値を表示できるが、数値が与えられた際にはエラーが発生する。
これを避けるためにはどうすれば良いだろうか。そう、**lengthが必ず実装されている事をユーザーに強制させれば良い**。

このように、動的型付き言語特有の、**オブジェクトの振る舞いに注目して処理を実装していく**プログラミングスタイルをダック・タイピングと呼ぶ。

名前の由来は「アヒルのように鳴き、アヒルのように歩けばそれはアヒルである」という文言から取られている。
その対象が対象と完全に一致している保証がなくとも、**こちらが期待する対象の挙動を振る舞っていれば、それは対象と同一である**と仮定して扱う考え方であることがよく分かる。

## behaviourを定義する
というわけでElixirを使い、想定される振る舞いを記述してみる。
`@callback`というキーワードを使い、このモジュールを使用する**ユーザーに実装してほしい振る舞い**を定義していく。

```elixir
defmodule Animal do
  @callback cry() :: String.t()
  @callback name() :: String.t()
end
```

## behaviourが定義されたモジュールを使う
上で定義したbehaviourを実際に使ってみる。
behaviourによって定義された関数を実装する際には特に何も付けなくてかまわない。

```elixir
defmodule Dog do
  @behaviour Animal

  def cry(), do: "bow wow"
  def name(), do: "Dog"
end
```

:::message
behaviourの実装を`@impl`というキーワードを付けて実装すると**その関数がbehaviourによるものであるという事が明示できる**ため可読性が上がる。

1つでも`@impl`を付けた場合、behaviourによって定義された関数すべてに`@impl`を付ける必要がある。
もし定義漏れがあった際にコンパイルエラーが発生するので、定義漏れがないことを担保できる。
```elixir
defmodule Dog do
  @behaviour Animal

  @impl Animal
  def cry(), do: "bow wow"

  @impl Animal
  def name(), do: "Dog"
end
```
:::

## behaviourを実装したモジュールを使う

`Animal`を実装したモジュールの配列を走査し、`cry`関数をすべて実行するモジュールの例。

```elixir
defmodule CryAllAnimal do
  def cryall(animals) do

    for animal <- animals, do: IO.puts(animal.cry)
    # bow wow
    # meow
    # [:ok, :ok]
  end
end
```

## Useとの関係 
useの動作はとてもシンプルで、

**対象のモジュールに定義された`__using__`という名前のマクロを展開する**。

以上の処理を行う。

文面にするととても短く見えるが、**すべてのモジュールにおいて一貫したマクロ呼び出し**が可能なため、非常に強力な機能となっている。

以下は`use`したモジュールに対して`greet`関数を展開している。

```elixir
defmodule UseSample do
  defmacro __using__(_opts) do
    quote do
      def greet(), do: IO.puts("Hey! This is UseSample macro!")
    end
  end
end

defmodule Sample do
  use UseSample

  def sample do
    IO.puts("This is Sample module!")
  end
end
```

iexで`Sample.greet`と実行すると`UseSample`の`__using__`に定義してある`greet()`関数が実行される。

## BehaviourとUseを併用してみる

先ほどのサンプルコードを`use`を使う形に書き直してみる。

```elixir
# behaviourの定義
defmodule Animal do
  defmacro __using__(_opts) do
    quote do
      @behaviour Animal
    end
  end

  @callback cry() :: String.t()
  @callback name() :: String.t()
end

# behaviourを実装する。従来の記法と違って`use`を使っている。
defmodule Dog do
  use Animal

  @impl Animal
  def cry(), do: "bow wow"

  @impl Animal
  def name(), do: "Dog"
end
```

このようにuseを併用することで、今までbehaviourを記述するたびに書いていた`@behaviour`という文言を省略できるようになった。
また、useの実態はマクロなので任意の処理をbehaviourと合わせて展開する事もできる。

## 実際の使用例

### Plug
Elixirにおいて最もポピュラーなbehaviourはPlugではないだろうか。

簡単に説明すると、Plugとは必要な関数を実装するだけでWebサーバを構築できるしくみ。
これを使うことでシンプルにWebサーバを実装できる。

ここでは先の説明を踏まえてcowboy_pugを使って簡単なWebサーバを構築してみる。

まず始めにMixプロジェクトを作成する。

```sh
mix new sample
```

以上で環境構築は完了したので、ここからは実際にWebサーバを実装していく。

```elixir
```
`iex -S mix`でiexを起動して以下のスクリプトを入力する。
```elixir
{:ok, _} = Plug.Cowboy.http SamplePlug.Router, []
```

エラーがなければ`{:ok, #PID<0.268.0>}`のように表示される。もちろんPIDの値は実行するたびに変わる。

![](https://storage.googleapis.com/zenn-user-upload/b67f08909b3c-20231125.png)

ブラウザから[localhost:4000](http://localhost:4000)にアクセスして上のように表示されたら成功。
また[localhost:4000/greet](http://localhost:4000/greet)にアクセスすると`Howdy!`と表示される。

## まとめ

- useとbehaviourは直接は関係ない。が、併用すると便利。
- behaviourは振る舞いを定義する
- behaviourはElixirにおいて非常に多用される
- Plugを使うことで簡単にWebサーバを実装する事ができる。
