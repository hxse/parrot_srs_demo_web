# 目前还不能在安卓上选择本地文件,只能在pc端chrome上用
  * https://bugs.chromium.org/p/chromium/issues/detail?id=1011535
  * https://bugs.chromium.org/p/chromium/issues/detail?id=1354695
  * 这些库可以在不支持File System Access API的时候,无缝退回到传统api,或者是后端服务
    * https://github.com/jimmywarting/native-file-system-adapter/
    * https://github.com/GoogleChromeLabs/browser-fs-access
# 需要把日志导出成csv, 然后用python训练优化, 2000次以上reviews才有意义
  * https://github.com/open-spaced-repetition/fsrs-optimizer
  * https://github.com/open-spaced-repetition/fsrs-rs
  * 一种选择是简单点, 导出配置文件和日志文件就行了, 用谷歌colab优化
  * 一种选择是复杂点, 把网页和python打包在一起, kivy
  * 一种选择就是等, 等优化器支持wasm和实时更新, 再把优化器继承到网页里
    * 非要自己研究的话很麻烦, 得看 fsrs-rs 源代码了,学 rust 把 fsrs-rs 集成到 wasm 里
    * 这个issues什么时候解决了才行 https://github.com/open-spaced-repetition/fsrs-rs/issues/99
# optimizer 测试数据
  * `python -m pip install fsrs-optimizer`
  * `python -m fsrs_optimizer "revlog.csv"`
  * 第一条的review_state为 0“的有效数据需要大于 100 条
  * https://colab.research.google.com/drive/1b8Ba_QMKfX2xsphl0vcF5rhiZRH3UzIb#scrollTo=y0vws_6YGy1n
  * https://colab.research.google.com/github/open-spaced-repetition/fsrs4anki/blob/main/fsrs4anki_optimizer.ipynb
  * https://github.com/open-spaced-repetition/fsrs-optimizer/issues/13
  * https://github.com/open-spaced-repetition/fsrs-optimizer/issues/36
  * https://github.com/siyuan-note/siyuan/issues/9309
  * 日志按如下格式就行了
    ```csv
    card_id,review_time,review_rating,review_state,review_duration
    20230723154504-duzgj0v,1691046464000,2,0,5
    20230713230946-17j80ne,1691046470000,2,2,5
    ```
# 框架问题
  * https://github.com/jimmywarting/native-file-system-adapter/issues/14
    * 目前不支持remove,所以用idb
# 音频问题
  * 使用mp3音频文件,时间戳会变的不够准确,使用ogg,flac,wav格式能保证时间戳准确,其中ogg格式大小最小,所以建议用ogg格式
  * https://stackoverflow.com/questions/25468063/html5-audio-currenttime-attribute-inaccurate
  * https://terrillthompson.com/624
  * https://stackoverflow.com/questions/37768732/how-to-convert-mp3s-to-constant-bitrate-using-ffmpeg
# todo
  * 用Legend-State重构
    * https://www.legendapp.com/open-source/state/intro/introduction/
  * 支持手柄,安卓浏览器不行 https://hardwaretester.com/gamepad
  * pwa意义不大,vite有点难搞 https://vite-pwa-org.netlify.app/frameworks/solidjs
  * 支持撤回和暂停
  * 支持自定义模版
  * 测试一下和anki的fsrs间隔是否一致
  * 浏览器对于自动播放音频限制
    * https://developer.chrome.com/blog/autoplay/
  * 重构时,删除getTestPreview模式, 多余没必要,getTestDate可以保留
