
# knife 小刀，全球首个模块化移动前端WebApp框架

Knife 专注移动前端H5的Web App框架，包含样式less和js，以不到10%的大小，实现比Bootstrap等传统框架跟好的体验、更强大的功能。  

完全兼容 微信、iOS 6.0+ 和 Android 4.0+，跨平台Web App必备利器。

全球首个从底层按模块方式重新构架的前端 Web App 框架，不依赖 jQuery.js、Zepto.js，使用时按需要引入模块，最小的kdom.js压缩后不到3K，可构造世界上体验最好、最小的web app应用！

该框架是诺亚公司在研发诺亚大陆微信公众号时，试用了各种前端框架，没有一个达到开发简单、体验接近原生APP的要求，没有办法，被迫自己动手构建的全新框架，随着项目的研发，会不断优化、完善该框架。  

完全基于现有js、html、css语法，不像 react、angular, 无需学习新的概念、理论，没有学习曲线，几分钟即可轻松上手，灵活、简单、强大，生成的Web App 比 bootstrap、react、angular 小 90%。  

js代码采用最新的 ES7 语法，babel 编译为 ES5 到前端运行，使用 webpack 模块化打包。

架构基础：

- [Framework7](https://github.com/nolimits4web/framework7/) (github star：7852)  
- 淘宝的[SUI](https://github.com/sdc-alibaba/SUI-Mobile) (github star：3776)
- 腾讯的[WeUI](https://github.com/weui/weui) (github star: 10703)
- [jQuery](https://github.com/jquery/jquery)(github star: 41397)
- [Zepto](https://github.com/madrobby/zepto)(github star: 11352)

站在巨人的肩膀上，根据实际项目需要，将原架构中对 jQuery、Zepto的依赖去掉，参考 jQuery、Zepto，重新构建了 knife.js 模块库，实现安需加载打包功能。  

彻底抛弃传统框架，最简单的页面被迫引用300K以上js、css模式，需要什么，加载什么，最小只需3K，彻底解放前端工程师，享受自己的应用，自己做主的掌控快感。

让我们用小刀，切开那些庞然大物，一起打造世界上最精美、最轻巧、最强大的移动 Web App 框架吧。



