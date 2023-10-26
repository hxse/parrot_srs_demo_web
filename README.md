# preview
  * https://hxse.github.io/parrot_srs_demo_web
# 目前还不能在安卓上选择本地文件,只能在pc端chrome上用
  * https://bugs.chromium.org/p/chromium/issues/detail?id=1011535
  * https://bugs.chromium.org/p/chromium/issues/detail?id=1354695
  * 这些库可以在不支持File System Access API的时候,无缝退回到传统api,或者是后端服务
    * https://github.com/jimmywarting/native-file-system-adapter/
    * https://github.com/GoogleChromeLabs/browser-fs-access
# 需要把日志导出成csv, 然后用python训练优化,至少1000条数据有效,2000次以上最好
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
  * https://huggingface.co/spaces/open-spaced-repetition/fsrs4anki_app
    * 上传csv, 然后选下时间戳就行了
  * https://colab.research.google.com/drive/1b8Ba_QMKfX2xsphl0vcF5rhiZRH3UzIb#scrollTo=y0vws_6YGy1n
  * https://colab.research.google.com/github/open-spaced-repetition/fsrs4anki/blob/main/fsrs4anki_optimizer.ipynb
  * https://github.com/open-spaced-repetition/fsrs-optimizer/issues/13
  * https://github.com/open-spaced-repetition/fsrs-optimizer/issues/36
  * https://github.com/siyuan-note/siyuan/issues/9309
  * 日志按如下格式就行了
    ```csv
    card_id,review_time,review_rating,review_state,review_duration
    20230723154504-duzgj0v,1691046464000,2,0,0
    20230713230946-17j80ne,1691046470000,2,2,0
    20230729082314-xvdkcte,1691046482000,2,2,0
    ```
# 数据格式
  * begin,undo,这些数据不会持久化到本地,刷新就消失了
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
    * 用key mapper可以映射安卓手柄 https://github.com/keymapperorg/KeyMapper
    * key mapper也有点问题, 映射不了方向键, 不过其他键能映射就不影响使用
  * pwa意义不大,vite有点难搞 https://vite-pwa-org.netlify.app/frameworks/solidjs
  * 支持自定义模版
  * 测试一下和anki的fsrs间隔是否一致
  * 浏览器对于自动播放音频限制
    * https://developer.chrome.com/blog/autoplay/
  * 重构时,删除getTestPreview模式, 多余没必要,getTestDate可以保留,config.json里的index字段没有用可以删了,属于历史遗留
  * 支持树状目录,人性化的导入后合并牌组, 导出后合并牌组, 重命名牌组文件夹, 调整牌组顺序, 目前不弄了, 太花里胡哨了,用命令行工具加上手动调整解决吧
    * 不过每张卡片都有deck_name字段, 以后有空弄是可以的
    * 快捷键设置可以放setting里,不过目前懒得写了
    * 统计也可以写一下,目前懒的写了
# 相关命令
  * https://github.com/hxse/parrot_fashion
    * 生成牌组
      * `g lw "D:\my_repo\parrot_fashion\download\BBC Learning English" 0 0 0 -enable_zip 1`
    * 合并牌组
      * `cd D:\my_repo\parrot_fashion\crawler`
      * `pdm run python .\loop_whisper.py mzf 'D:\my_repo\parrot_fashion\download\Kurzgesagt  In a Nutshell\Kurzgesagt  In a Nutshell - Videos UCsXVk37bltHxD1rDPwtNM8Q' "C:\Users\hxse\Downloads\srs file" -regex="^.*2022(0[6789]|1[012]).*mp3$"  -stemStart 0 -stemEnd -1`
