---
title: "gitignoreを生成するツールを作った"
emoji: "🦊"
type: "tech"
topics: [go, git, cli]
published: true
---

どうも、こまもかです。
今回はGoで`gitignore`を生成するツールを作ったのでその紹介をします。

https://github.com/Comamoca/igonore

## 主な特徴

- 対話的に生成出来る

go-promptuiとgo-fuzzyfinderを使って直感的に生成出来るようになっています。

- 実行時に言語の指定する事も出来る

指定したい言語が既に決まっている場合は`igonore lang lang2`の様に指定すると、プロンプトをスキップして生成出来ます。

ちなみに、生成自体は[gitignore.io](https://gitignore.io)で行っています。

## 実装の所感

- プロンプトとファジーファインダーの組み合わせ

このツールの最大の売りである、「直感的な操作感」を支えているのは`go-promptui`と`go-fuzzyfinder`です。
以前`go-promptui`で対話的なツールを作っている時に、**選択肢が多くなってくると選択さえも面倒に感じた**ので、なんとか選択しやすいUIを作れないか
考えていました。
そんな時に、`commitizen`の様なUIにすれば扱いやすくなるのではないかと考え、このライブラリの組み合わせを思いつきました。

実際に実装してみると、予想通りのUIが出来上がり大変満足しています。しかし、現状の実装方法では、**errを選択結果の取得に利用している**為、もしその辺りでエラーが発生するとクラッシュする可能性があるという無理な実装になってしまっています。これからはそれらの問題を解決する事に注力したいです。

gitignoreの生成をする際はぜひ利用してみて下さい!
