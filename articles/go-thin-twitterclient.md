---
title: "GoでシンプルなTwitterライブラリを書いた"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [go, twitterapi, ライブラリ]
published: true
---

どうも、こまもかです。
今回はGoでシンプルなTwitterライブラリを書いてみたのでそれについて紹介します。

## 動機

Goには既にいくつものTwitterライブラリがあるのにどうして新しく作ろうと思ったのか。それはズバリ「覚えることが多かったから」です。
従来のライブラリは覚えることが多く、TwitterAPIでやりたい事が限られている僕にとってはオーバースペックだと感じたからです。

現にこのライブラリを作る前に使っていた、[anaconda](https://github.com/ChimeraCoder/anaconda)というライブラリを使っていました。しかし、前にも述べたとおり、構造体や要素の名前を確認する必要があったりと、少しだけAPIを使いたい僕にとっては過剰すぎると感じました。

また、先に書いたような事について悩んでたときに、このような記事を見つけました。今回作ったライブラリはこのライブラリを意識して書いています。

https://zenn.dev/yhara/articles/21e496263108ae


## ライブラリについて

ライブラリの名前は[thin](https://github.com/Comamoca/thin)と言います。その名の通りとてもスリムでシンプルです。
詳しい使い方はREADMEに載っていますが、ここでも軽く説明します。

:::message
thinはTwitterAPI v1.1にしか対応していません。作者がTwitterAPI v2を使えるようになったら実装する予定です。
:::

thinの使い方はとてもシンプルです。覚える事はたった２つだけです。それは、

**thin.Auth()で認証を行い、Client.Get()でAPIを叩く**

これだけです。ね、簡単でしょ？ここからはもう少し詳しく説明します。

`thin.Auth()`は`thin.ApiKeys`を元に`thin.Client`を生成します。このオブジェクトの実態は`http.Client`です。(厳密には要素がhttp.Client)

```go
keys := thin.ApiKeys{
	ConsumerKey:			 os.Getenv("CONSUMER_KEY"),
	ConsumerSecret:		 os.Getenv("CONSUMER_SECRET"),
	AccessToken:			 os.Getenv("ACCESS_TOKEN"),
	AccessTokenSecret: os.Getenv("ACCESS_TOKEN_SECRET"),
}

client := keys.Auth()
```

`thin.Client`には`Client.Get`レシーバーがあって、urlを指定するとTwitterAPIのJson文字列を返してくれます。

:::message
ごめんなさい。Client.Setはまだ実装されていません。これから実装するつもりです。
:::

```go
resp, err := client.Get(url)
if err != nil {
	fmt.Println(err)
}
```

あとはもう自由です好きなライブラリなりを使ってJsonから取得したい要素を取り出すだけです。僕は[gjson](https://github.com/tidwall/gjson)が好きなのでそれを使って値を取り出しています。

## サンプルプログラム

後々サンプルプログラムを上げる予定ですが、ここにも貼っておきます。
これは#Twitterで検索して出てきたツイートの内容を取得して表示するプログラムです。

```go
package main

import (
	"fmt"
	"net/url"
	"os"

	"github.com/Comamoca/thin"
	"github.com/joho/godotenv"
	"github.com/tidwall/gjson"
)

func getTweets(jsn string) []string {
	// 実際にツイート内容を取得する処理

	// ツイート内容を格納するスライス
	var txts []string
	for _, tweet := range gjson.Get(string(jsn), "statuses").Array() {
		// ツイート内容をリストに追加
		txts = append(txts, gjson.Get(tweet.String(), "text").String())
	}

	return txts
}

func main() {
	// .envの読み込み
	godotenv.Load("../../.env")

	
	keys := thin.ApiKeys{
		ConsumerKey:			 os.Getenv("CONSUMER_KEY"),
		ConsumerSecret:		 os.Getenv("CONSUMER_SECRET"),
		AccessToken:			 os.Getenv("ACCESS_TOKEN"),
		AccessTokenSecret: os.Getenv("ACCESS_TOKEN_SECRET"),
	}

	// Clientの作成
	client := keys.Auth()

	endp := "https://api.twitter.com/1.1/search/tweets.json?"
	v := url.Values{}

	// 検索するクエリの作成
	v.Set("q", "#Twitter")

	// URL生成用の構造体に代入
	tu := thin.ThinUrl{RawUrl: endp, Value: v}

	// 実際に叩くURLの生成
	url, err := thin.GenerateUrl(tu)

	if err != nil {
		fmt.Println(err)
	}

	// fmt.Println(url)
	resp, err := client.Get(url)

	if err != nil {
		fmt.Println(err)
	}

	// APIを叩く
	twts := getTweets(resp)

	// 結果の表示
	for idx, twt := range twts {
		fmt.Printf("%d: %s\n", idx, twt)
		fmt.Println("-----------------------------------------")
	}
}
```

今回はGoでシンプルなTwitterライブラリを書いた話をしました。
もしライブラリを使うほどではないけど自前で実装するのはめんどくさいなぁと思うときに使ってみてください！
