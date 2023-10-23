import { createSignal, createEffect, on, Show, batch, onMount, For } from 'solid-js'

import './App.css'

import { openFile, openDir, getFile, parseDir } from "./pick_file.ts"
import { store, createIdb } from './idb_io.ts'

import { initFsrs, newCard, schedulingCard, str2json, json2str } from "./fsrs-api.ts"

import { createZip, createFile } from './convert-zip.ts'
import jsZip from 'jszip'
import { dateTimeDiff } from "date-differencer";
import { init_keyboard } from './keyboard.ts'

function sameDay(date1: Date, date2: Date) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

function datediff(first: Date, second: Date) {
  first.setSeconds(first.getSeconds() - 3);//error
  const diff = dateTimeDiff(first, second)
  return diff.years > 0 ? diff.years + 'Y' : diff.months > 0 ? diff.months + 'M' : diff.days > 0 ? diff.days + 'D' : diff.minutes + 'm'
}

function createCardId(card: any, length = 7) {
  if (!card.card_id) {
    const randomStr = Array(length).fill(0).map(() => Math.random().toString(36).charAt(2)).join('')
    const d = new Date()
    const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + String(d.getSeconds()).padStart(2, "0")
    card.card_id = `${dateStr}-${randomStr}`
  }
  return card.card_id
}

function preProcessing(obj: any) {
  obj.name = obj.name.replaceAll(' ', '_')
  if (!obj.index) {
    obj.index = 0
  }
}

function getCacheName(file: any, obj: any) {
  return `${obj.name} ${file.name}`
}

function reSetArr(fileData: any) {
  const waitArr = []//已过期的旧卡
  const oldArr = []//未过期的旧卡
  const newArr = []//未学过的新卡
  const _oldArr = []//临时数组
  const pauseArr = []//已暂停的数组
  for (let index = 0; index < fileData.card.length; index++) {
    const card = fileData.card
    const fsrs = card[index].fsrs;
    if (card[index].pause) {
      pauseArr.push(index)
      continue
    }
    if (fsrs) {
      _oldArr.push(index)
    } else {
      newArr.push(index)
    }
  }
  _oldArr.sort(function (a, b) {
    const dueA = fileData.card[a].fsrs.due
    const dueB = fileData.card[b].fsrs.due
    return dueA.getTime() - dueB.getTime()
  });

  for (const i of _oldArr) {
    const now = new Date()
    const due = fileData.card[i].fsrs.due
    const diffTime = now.getTime() - due.getTime()
    if (diffTime >= 0) {
      waitArr.push(i)
    } else {
      oldArr.push(i)
    }
  }
  return {
    waitArr: waitArr.map((i) => ({ idx: i, card: fileData.card[i] })),
    oldArr: oldArr.map((i) => ({ idx: i, card: fileData.card[i] })),
    newArr: newArr.map((i) => ({ idx: i, card: fileData.card[i] })),
    pauseArr: pauseArr.map((i) => ({ idx: i, card: fileData.card[i] })),
  }
}

async function cleanUserData(fileObj: any, fk: string) {
  const [, name] = [fk.split(' ').slice(0, -1).join(' '), fk.split(' ').slice(-1).join(' ')]
  if (name == "config.json") {
    const text = await fileObj.text()
    const obj = str2json(text);
    for (let c of obj.card) {
      if (c.fsrs) {
        delete c.fsrs
      }
      if (c.firstUpdate) {
        delete c.firstUpdate
      }
      if (c.card_id) {
        delete c.card_id
      }
      if (c.pause) {
        delete c.pause
      }
    }
    const str = json2str(obj)
    const newfileObj = createFile(str, name)
    return newfileObj
  }
  if (name == "revlog.csv") {
    const newfileObj = createFile('', name)
    return newfileObj
  }
  return fileObj
}

function addUndo(mode: string, undoObj: any[], fdObj: any, max: number) {
  const getLast = (i: any[], n: number) => i.slice(-n == 0 ? i.length : -n, i.length)
  if (max < 0) {
    throw new Error(`getUndoMax 是大于等于0的整数 ${max}`);
  }
  const str = json2str(fdObj)
  if (mode == "update") {
    return [...getLast(undoObj, max - 1), { "act": "update", "config.json": str }]
  }
  if (mode == 'pause') {
    return [...getLast(undoObj, max - 1), { "act": "pause", "config.json": str }]
  }
  if (mode == "delete") {
    return [...undoObj.slice(0, - 1)]
  }
  return []
}

function getDeck(fdObj: any) {
  const res: any = []
  for (const f of fdObj.card) {
    function find() {
      for (const r of res) {
        if (r.deck_name == f.deck_name) {
          return r
        }
      }
      return undefined
    }
    let obj: any = find()
    if (obj === undefined) {
      obj = { deck_name: f.deck_name, card: [f] }
      res.push(obj)
    } else {
      obj.card = [...obj.card, f]
    }
  }
  console.log('deckArr', res)
  return res
}

let audioRef: any
let beginRef: any
let startOffsetRef: any
let endOffsetRef: any
let logRef: any

function App() {
  //test参数是用来测试的
  const [getTestDate,] = createSignal<boolean>(false)
  const [getTestPreview,] = createSignal<boolean>(false)

  const [getIdb, setIdb] = createSignal<any>()
  // const [getIdb, setIdb] = createSignal<any>()

  const [getDeckArr, setDeckArr] = createSignal<any[]>([])
  const [getDeckIdx, setDeckIdx] = createSignal<number>(-1)
  const [getDeckCount, setDeckCount] = createSignal<number>(-1)

  const [getIndex, setIndex] = createSignal<number | undefined>(undefined)
  const [getIsLoad, setIsLoad] = createSignal(false)
  const [getFileData, setFileData] = createSignal<any>({})
  // const [getFileObj, setFileObj] = createSignal<any>({})
  const [getRating, setRating] = createSignal<any>({})
  const [getMediaArr, setMediaArr] = createSignal<any>([])

  const [getIsFront, setIsFront] = createSignal(true)

  const csvField = 'card_id,review_time,review_rating,review_state,review_duration,timezone,day_start,deck_name,card_sort'
  const [getLogsCsv, setLogsCsv] = createSignal<Array<string>>([])
  const [getLogsCsvExtend, setLogsCsvExtent] = createSignal<Array<string>>([])//就是把logscsv根据pause净化一下
  const [getIsLogsFilter,] = createSignal<boolean>(true)//浏览器参数,不过不建议改,意义不大

  //https://github.com/open-spaced-repetition/fsrs-optimizer
  const [getIsCacheFile, setIsCacheFile] = createSignal<boolean>(false)
  const [getIsCacheLog, setIsCacheLog] = createSignal<boolean>(false)

  const [getLimit,] = createSignal<number>(10)
  const [getLimitCur, setLimitCur] = createSignal<number>(0)
  const [getLimitDue, setLimitDue] = createSignal<number>(0)
  const [getOldArrNum, setOldArrNum] = createSignal<number>(0)
  const [getWaitArrNum, setWaitArrNum] = createSignal<number>(0)
  const [getPauseArrNum, setPauseArrNum] = createSignal<number>(0)

  const [getIsWarning, setIsWarning] = createSignal<boolean>(false)

  const [getUndo, setUndo] = createSignal<any[]>([])
  const [getUndoMax,] = createSignal<number>(10)//大于等于0的整数

  const [getStep,] = createSignal<number>(1)//大于等于0
  const [getStepLong,] = createSignal<number>(2)//大于等于0


  // const [getStartOffset, setStartOffset] = createSignal<number>(0)
  // const [getEndOffset, setEndOffset] = createSignal<number>(0)

  // const [getWaitArr, setWaitArr] = createSignal<Array<number>>([])
  // const [getOldArr, setOldArr] = createSignal<Array<number>>([])
  // const [getNewArr, setNewArr] = createSignal<Array<number>>([])

  const [getLockAudio, setLockAudio] = createSignal<boolean>(true)
  const [getBeginAudio, setBeginAudio] = createSignal<number>(0)


  function getBegin(startTime: any, endTime: any, data: any) {
    if (data.begin == 0) {
      return startTime
    } else {
      const b = parseFloat(parseFloat(data.begin).toFixed(2))
      return parseFloat(parseFloat(startTime + (endTime - startTime) * b).toFixed(2))
      //startOffset会存到本地,但是startTime不会,所以随便改
    }
  }

  async function audioPlay(data: any) {
    if (getLockAudio()) {
      if (!data) {
        return
      }
      // console.log('audioPlay', data.startTime, data.endTime, audioRef.currentTime)
      let startTime = srtTime2second(data.startTime) / 1000
      let endTime = srtTime2second(data.endTime) / 1000
      // console.log('a1', startTime, endTime, audioRef.currentTime)

      startTime = getBegin(startTime, endTime, data)
      // console.log('b1', startTime, endTime, audioRef.currentTime)

      startTime = parseFloat((startTime + (!data.startOffset ? 0 : parseFloat(data.startOffset))).toFixed(2));
      endTime = parseFloat((endTime + (!data.endOffset ? 0 : parseFloat(data.endOffset))).toFixed(2));
      // console.log('c1', startTime, endTime, audioRef.currentTime)


      try {
        if (startTime > endTime) {
          console.log(`时间戳偏移量调过头了 ${startTime} ${endTime}`)
          setIsWarning(true)
          return
        }
        setIsWarning(false)
        // console.log('d1', startTime, endTime, audioRef.currentTime)
        audioRef.currentTime = startTime
        await audioRef.play();
      } catch (error) {
        console.log('浏览器自动播放受限,1.手动点击解除限制 2.安装pwa解除限制 3.移动端添加到主屏幕解除限制', error)
      }
    } else {
      try {
        await audioRef.play();
      } catch (error) {
        console.log('浏览器自动播放受限,1.手动点击解除限制 2.安装pwa解除限制 3.移动端添加到主屏幕解除限制', error)
      }
    }
  }
  async function audioUpdate(data: any) {
    if (!data) {
      return
    }
    if (getLockAudio()) {
      // console.log('audioUpdate', data.startTime, data.endTime, audioRef.currentTime)
      let startTime = srtTime2second(data.startTime) / 1000
      let endTime = srtTime2second(data.endTime) / 1000
      // console.log('a2', startTime, endTime, audioRef.currentTime)

      startTime = getBegin(startTime, endTime, data)
      // console.log('b2', startTime, endTime, audioRef.currentTime)

      startTime = parseFloat((startTime + (!data.startOffset ? 0 : parseFloat(data.startOffset))).toFixed(2))
      endTime = parseFloat((endTime + (!data.endOffset ? 0 : parseFloat(data.endOffset))).toFixed(2))
      // console.log('c2', startTime, endTime, audioRef.currentTime)

      try {
        if (startTime > endTime) {
          console.log(`时间戳偏移量调过头了 ${startTime} ${endTime}`)
          setIsWarning(true)
          return
        }
        setIsWarning(false)
        if (audioRef.currentTime < startTime) {
          // console.log('d2', startTime, endTime, audioRef.currentTime)
          audioRef.currentTime = startTime
          await audioRef.play();
        }
        if (audioRef.currentTime > endTime) {
          // console.log('e2', startTime, endTime, audioRef.currentTime)
          audioRef.currentTime = startTime
          await audioRef.play();
        }
      } catch (error) {
        console.log('浏览器自动播放受限,1.手动点击解除限制 2.安装pwa解除限制 3.移动端添加到主屏幕解除限制', error)
      }
    } else {
      try {
        await audioRef.play();
      } catch (error) {
        console.log('浏览器自动播放受限,1.手动点击解除限制 2.安装pwa解除限制 3.移动端添加到主屏幕解除限制', error)
      }
    }
  }

  function srtTime2second(time: string) {
    //返回毫秒
    let _ = time.split(',')[0].split(':')
    let hour = parseInt(_[0]) * 60 * 60 * 1000
    let minute = parseInt(_[1]) * 60 * 1000
    let second = parseInt(_[2]) * 1000
    let millisecond = parseInt(time.split(',')[1])
    return hour + minute + second + millisecond
  }

  function reSetIndex(fileData: any) {
    const { waitArr, oldArr, newArr, pauseArr } = reSetArr(fileData)

    console.log('waitArr', waitArr)
    console.log('oldArr', oldArr)
    console.log('newArr', newArr)
    console.log('pauseArr', pauseArr)
    setOldArrNum(oldArr.length)
    setWaitArrNum(waitArr.length)
    setPauseArrNum(pauseArr.length)

    const fCur = ({ card }: any) => sameDay(card.firstUpdate, new Date())
    const lCur = [...waitArr, ...oldArr].filter((obj) => fCur(obj))
    setLimitCur(lCur.length)

    const fDue = ({ card }: any) => sameDay(card.firstUpdate, new Date()) && sameDay(card.fsrs.due, new Date())
    const lDue = [...waitArr, ...oldArr].filter((obj) => fDue(obj))
    setLimitDue(lDue.length)

    if (waitArr.length > 0) {
      return waitArr[0].idx
    }

    if (lCur.length >= getLimit()) {
      if (lDue.length > 0) {
        return lDue[0].idx
      }
      return undefined
    }

    if (newArr.length > 0) {
      return newArr[0].idx
    }
  }

  function getAudio(data: any) {
    if (!data) {
      return ""
    }
    const audioArr = getMediaArr().filter((i: any) => i.name == `media/${data.audio_name}`)
    if (audioArr.length > 0) {
      return URL.createObjectURL(audioArr[0])
    }
    return ""
  }

  async function readZip() {
    const fileHandle = await openFile()
    const file = await getFile(fileHandle)
    try {
      const zip = await jsZip.loadAsync(file)
      await readDir(zip.files, 'zip')
    } catch (error) {
      console.log(error)
    }
  }

  async function readDir(dirHandle: any, mode: string) {
    const { fileArr, mediaArr } = await parseDir(dirHandle, mode)

    let obj: any

    async function updateIdb() {
      await store(getIdb(), 'clear', { storeName: 'file' })
      await store(getIdb(), 'clear', { storeName: 'media' })
      for (const fileHandle of fileArr) {
        const file = await getFile(fileHandle)
        await store(getIdb(), 'put', { storeName: 'file', value: file, key: getCacheName(fileHandle, obj) })
      }
      for (const fileHandle of mediaArr) {
        const file = await getFile(fileHandle)
        await store(getIdb(), 'put', { storeName: 'media', value: file, key: getCacheName(fileHandle, obj) })
      }
    }

    let flag = false
    for (const fileHandle of fileArr) {
      if (fileHandle.name == 'config.json') {
        flag = true
        const file = await getFile(fileHandle)
        const text = await file.text()
        obj = str2json(text);
        preProcessing(obj)
        await updateIdb()
        batch(async () => {
          setIsLoad(true)
          setFileData(obj)

          setDeckArr(getDeck(obj))
          // setFileObj(file)
          if (getTestPreview()) {
            setIndex(obj.index)
          } else {
            setIndex(reSetIndex(obj))
          }

          const m = []
          for (const fileHandle of mediaArr) {
            m.push(await getFile(fileHandle))
          }
          setMediaArr(m)

          setUndo([])

          setIsFront(true)
        })
      }
      if (fileHandle.name == 'revlog.csv') {
        const file = await getFile(fileHandle)
        const text = await file.text()
        const logArr = text.split('\n').filter((i: string) => i.trim())
        setLogsCsv(logArr.length > 0 ? logArr : [csvField])
      }
    }
    if (!flag) {
      const message = "文件结构不对,没找到config.json文件"
      alert(message)
      console.log(message)
    }
  }

  async function runSaveFile(no_data: boolean) {
    const fileKeys = await store(getIdb(), 'getAllKeys', { storeName: 'file' })
    const mediaKeys = await store(getIdb(), 'getAllKeys', { storeName: 'media' })
    const fileArr = []
    const mediaArr = []
    for (let fk of fileKeys) {
      let fileObj = await store(getIdb(), 'get', { storeName: 'file', key: fk })
      if (no_data) {
        fileObj = await cleanUserData(fileObj, fk)
      }
      fileArr.push(fileObj)
    }
    for (let mk of mediaKeys) {
      const fileObj = await store(getIdb(), 'get', { storeName: 'media', key: mk })
      mediaArr.push(fileObj)
    }
    for (const file of fileArr) {
      if (file.name == "config.json") {
        const text = await file.text()
        const obj = str2json(text);
        createZip(obj['name_zip'] ? obj['name_zip'] : "demo.zip", fileArr, mediaArr)
      }
    }
  }


  onMount(async () => {
    //todo 这里要读一下indexeddb缓存
    // if (navigator.storage && navigator.storage.persist) {
    //   navigator.storage.persisted().then((persistent) => {
    //     if (persistent) {
    //       console.log("Storage will not be cleared except by explicit user action");
    //     } else {
    //       console.log("Storage may be cleared by the UA under storage pressure.");
    //     }
    //   });
    // }

    init_keyboard()

    const idb = await createIdb()
    setIdb(idb)

    initFsrs(undefined, 0.9)

    const res = await store(getIdb(), 'getAllKeys', { storeName: 'file' })
    const fileArr: any[] = []
    for (const i of res) {
      // const [deck_name, name] = [fullName.split(' ').slice(0, 1).join(' '), fullName.split(' ').slice(1).join(' ')]
      const file = await store(getIdb(), 'get', { storeName: 'file', key: i })
      fileArr.push(file)
    }
    console.log('use cache fileArr', fileArr)

    const res2 = await store(getIdb(), 'getAllKeys', { storeName: 'media' })
    const mediaArr: any[] = []
    for (const i of res2) {
      // const [deck_name, name] = [fullName.split(' ').slice(0, 1).join(' '), fullName.split(' ').slice(1).join(' ')]
      const file = await store(getIdb(), 'get', { storeName: 'media', key: i })
      mediaArr.push(file)
    }
    console.log('use cache mediaArr', mediaArr)


    batch(async () => {
      for (const file of fileArr) {
        if (file.name == 'config.json') {
          const text = await file.text()
          const obj = str2json(text);
          setIsCacheFile(true)
          // setFileObj(file)
          setFileData(obj)
          setDeckArr(getDeck(obj))
          if (getTestPreview()) {
            setIndex(obj.index)
          } else {
            setIndex(reSetIndex(obj))
          }
          setIsLoad(true)
          setMediaArr(mediaArr)

          setIsFront(true)

          // playAudio()
          // audioRef.play()//浏览器对于自动播放有限制 https://developer.chrome.com/blog/autoplay/
        }
        if (file.name == 'revlog.csv') {
          const text = await file.text()
          setIsCacheLog(true)
          const logArr = text.split('\n').filter((i: string) => i.trim())
          setLogsCsv(logArr.length > 0 ? logArr : [csvField])
          logRef.scrollTop = logRef.scrollHeight;
        }
      }
    })

  });

  createEffect(on(getIndex, (index) => {
    if (!getTestPreview()) {
      showRating(-1, false)
      if (index !== undefined) {
        const deckArr = getDeckArr()
        const idx = deckArr.map((i) => i.deck_name).indexOf(getFileData().card[index].deck_name)
        setDeckIdx(idx)
        setDeckCount(deckArr.length)
      }
      return
    }
    if (index !== undefined) {
      setFileData((i) => {
        if (i.index == index) {
          return i
        }
        i.index = index
        return { ...i }
      })
      showRating(-1, false)
    }
  }, { defer: false }));

  createEffect(on(getDeckArr, (deckArr) => {
    if (getFileData().name) {
      console.log(deckArr)
      // debugger
    }
  }, { defer: false }));


  createEffect(on(getFileData, async () => {
    if (getIsCacheFile()) {
      console.log('load: cache getFileData')
      setIsCacheFile(false)
      return
    }
    if (getFileData().name) {
      const file = { 'name': "config.json" }//这个最简单直接,不然太麻烦了
      const obj = getFileData()
      const str = json2str(obj)
      const newFile = createFile(str, file.name)
      await store(getIdb(), 'put', { storeName: "file", value: newFile, key: getCacheName(file, obj) })
      console.log('change: fileData', getFileData())
    } else {
      console.log('init: fileData', getFileData())
    }
  }, { defer: true }));

  createEffect(on(getLogsCsv, async () => {

    async function putCsv(csvArr: any[]) {
      const file = { 'name': "revlog.csv" }//这个最简单直接,不然太麻烦了
      const str = csvArr.join('\n')
      const newFile = createFile(str, file.name)
      console.log('change: logsCsv', getFileData())
      await store(getIdb(), 'put', { storeName: "file", value: newFile, key: getCacheName(file, getFileData()) })
    }

    async function runCsvExtend() {
      //派生一个log对象,根据pause过滤,只用来导出和显示,不用来做持久化
      if (getIsLogsFilter()) {
        const csvArr = getLogsCsv()
        const parseIdArr = getFileData().card.filter((i: any) => i.pause).map((i: any) => i.card_id)
        console.log(csvArr.length)
        const csvArrExtend = csvArr.filter((c) => {
          const res = parseIdArr.filter((i: any) => {
            return c.split(',')[0] == i
          })
          return res.length == 0
        })

        const newCsvArr = [...csvArrExtend]
        setLogsCsvExtent(newCsvArr)
        await putCsv(newCsvArr)
      }
    }

    if (getIsCacheLog()) {
      console.log('cache: getLogsCsv')
      await runCsvExtend()
      setIsCacheLog(false)
      return
    }

    if (getFileData().name) {
      await putCsv(getLogsCsv())
      await runCsvExtend()
    } else {
      console.log('init: logsCsv', getFileData())
    }

    logRef.scrollTop = logRef.scrollHeight;

  }, { defer: true }));

  function showRating(rating: number, update = false) {

    const idx = getIndex()
    if (idx === null || idx === undefined) return

    let card = getFileData()?.card[idx]?.fsrs
    if (!card) {
      card = newCard()
    }

    let scheduling_cards = schedulingCard(card, getTestDate())


    if (update) {
      const { card, review_log } = scheduling_cards[rating]
      batch(async () => {
        setFileData((fdObj) => {

          setUndo((undoObj) => {
            return addUndo('update', undoObj, { ...fdObj }, getUndoMax())
          })

          fdObj.card[idx].fsrs = card
          if (!fdObj.card[idx].firstUpdate) {
            fdObj.card[idx].firstUpdate = card.last_review
          }
          if (!getTestPreview()) {
            const res = reSetIndex(fdObj)
            fdObj.index = res
            setIndex(res)
          }
          return { ...fdObj }
        })
      })
      scheduling_cards = schedulingCard(card, getTestDate())

      function updateLog() {
        if (idx === null || idx === undefined) {
          return
        }
        const logObj = {
          card_id: createCardId(getFileData().card[idx]),
          review_time: review_log['review'].getTime(),
          review_rating: review_log['rating'],
          review_state: review_log['state'],
          review_duration: 5,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          day_start: 8,
          deck_name: getFileData().card[idx].deck_name.replaceAll(',', ' '),
          card_sort: idx,
        }
        const logCsv = `${logObj.card_id},${logObj.review_time},${logObj.review_rating},${logObj.review_state},${logObj.review_duration},${logObj.timezone},${logObj.day_start},${logObj.deck_name},${logObj.card_sort}`
        setLogsCsv((i) => {
          i.push(logCsv)
          return [...i]
        })
      }
      updateLog()
      return
    }

    for (let num of [1, 2, 3, 4]) {
      const { card, } = scheduling_cards[num]
      const diff = datediff(new Date(), card.due)
      setRating((i) => {
        i[num] = diff
        return { ...i }
      })
    }

  }

  return (
    <>
      <div class="card">
        <button onClick={readZip}>
          打开文件
        </button>
        <button onClick={async () => {
          const dirHandle = await openDir()
          await readDir(dirHandle, 'dir')
        }}>
          打开文件夹
        </button>
        <button onclick={() => {
          // runDownloadFile(fileData())
          runSaveFile(false)
        }}>保存</button>
        <button onclick={() => {
          // runDownloadFile(fileData())
          runSaveFile(true)
        }}>保存不带数据</button>
        <button onclick={() => {
          store(getIdb(), 'clear', { storeName: 'file' })
          store(getIdb(), 'clear', { storeName: 'media' })
          location.reload();
        }}>清理缓存</button>
        <button id="undo" onclick={() => {
          setUndo((undoObj) => {
            const last = undoObj[undoObj.length - 1]
            if (last) {
              if (last.act == "update" || last.act == "pause") {
                const fdObj = str2json(last['config.json'])
                batch(async () => {
                  setFileData({ ...fdObj })
                  if (getTestPreview()) {
                    setIndex(fdObj.index)
                  } else {
                    setIndex(reSetIndex(fdObj))
                  }
                  if (last.act == "update") {
                    console.log('回撤update模式', undoObj)
                    setLogsCsv((i: string[]) => i.slice(0, - 1))
                  } else {
                    setLogsCsv((i: string[]) => [...i])
                    console.log('回撤pause模式', undoObj)
                  }
                  setIsFront(true)
                })
              }
            }
            return addUndo('delete', undoObj, undefined, getUndoMax())
          })
        }}>回撤</button>
        <button id="pause" onclick={() => {
          batch(async () => {
            setFileData((i) => {
              const idx = getIndex()
              if (idx == undefined) {
                return i
              }

              setUndo((undoObj) => {
                return addUndo('pause', undoObj, { ...i }, getUndoMax())
              })

              i.card[idx].pause = true

              if (getTestPreview()) {
                setIndex(idx)
              } else {
                setIndex(reSetIndex(i))
              }
              setLogsCsv((i) => [...i])
              return { ...i }
            })
            setIsFront(true)
          })
        }}>{'暂停'}</button>

        <Show when={getTestDate()}>
          <button onClick={() => {
            setIndex((index) => {
              if (index === undefined || index === null) {
                return index
              }
              index = index - 1 < 0 ? 0 : index - 1
              return index
            })
          }}>
            prev
          </button>
          <button onClick={() => {
            setIndex((index) => {
              if (index === undefined || index === null) {
                return index
              }
              index = index + 1 >= getFileData().card.length - 1 ? getFileData().card.length - 1 : index + 1
              return index
            })
          }}>
            next
          </button>
        </Show>

        <div>
          {`idx: ${getIndex()} deck: ${getDeckIdx()}/${getDeckCount()} limit: ${getLimitDue()}/${getLimitCur()}/${getLimit()} count: ${getWaitArrNum()}/${getOldArrNum()}/${getFileData()?.card?.length - getPauseArrNum()}|-${getPauseArrNum()} undo: ${getUndo().length}/${getUndoMax()} log:${getLogsCsvExtend().length - 1}`}
        </div>

        <div class="text">
          <Show
            when={getIsLoad()}
            fallback={<div class="wait">please select a local file</div>}
          >

            <div class="text-child">
              <div>
                <div>
                  <audio id="myAudio" ref={audioRef} controls src={
                    ((): any => {
                      const idx = getIndex()
                      return getAudio(idx === undefined ? undefined : {
                        deck_name: getFileData()?.card?.[idx]?.deck_name,
                        audio_name: getFileData()?.card?.[idx]?.audio_name
                      })
                    })()
                  }
                    onTimeUpdate={
                      () => {
                        const idx = getIndex()
                        audioUpdate(idx === undefined ? undefined : {
                          startTime: getFileData()?.card?.[idx]?.start,
                          endTime: getFileData()?.card?.[idx]?.end,
                          startOffset: getFileData()?.card?.[idx]?.startOffset,
                          endOffset: getFileData()?.card?.[idx]?.endOffset,
                          begin: getBeginAudio()
                        })
                      }
                    }
                  >
                    {/* <source id="myAudio" src={getAudio()} type="audio/mp3" ></source> */}
                  </audio>
                </div>
                <div>
                  <button
                    id="play"
                    onclick={
                      () => {
                        const idx = getIndex()
                        audioPlay(idx === undefined ? undefined : {
                          startTime: getFileData()?.card?.[idx]?.start,
                          endTime: getFileData()?.card?.[idx]?.end,
                          startOffset: getFileData()?.card?.[idx]?.startOffset,
                          endOffset: getFileData()?.card?.[idx]?.endOffset,
                          begin: getBeginAudio()
                        })
                      }
                    }
                  >play</button>
                  <button
                    id="backward"
                    onclick={
                      () => {
                        audioRef.currentTime -= getStep()
                      }
                    }
                  >{'<-'}</button>
                  <button
                    id="forward"
                    onclick={
                      () => {
                        audioRef.currentTime += getStep()
                      }
                    }
                  >{'->'}</button>
                  <button
                    id="backward2"
                    onclick={
                      () => {
                        audioRef.currentTime -= getStepLong()
                      }
                    }
                  >{'<--'}</button>
                  <button
                    id="forward2"
                    onclick={
                      () => {
                        audioRef.currentTime += getStepLong()
                      }
                    }
                  >{'-->'}</button>
                  <br />
                  <label > lock</label>
                  <input id="lock" type="checkbox" checked={getLockAudio()} onclick={() => {
                    setLockAudio(!getLockAudio())
                  }} />

                  <label > {'||>'}</label>
                  <input id="startOffset" ref={startOffsetRef} class='offset' type="number" step="0.1" value={
                    (() => {
                      const idx = getIndex()
                      if (!idx) {
                        return 0
                      }
                      return !getFileData()?.card?.[idx]?.startOffset ? 0 : getFileData()?.card?.[idx]?.startOffset
                    })()
                  } onInput={(e) => {
                    batch(async () => {
                      setFileData((i) => {
                        const idx = getIndex()
                        if (idx == undefined) {
                          return i
                        }
                        if (parseFloat(e.target.value) == 0) {
                          delete i.card[idx].startOffset
                        } else {
                          i.card[idx].startOffset = e.target.value
                        }
                        return { ...i }
                      })
                    })
                    startOffsetRef.focus()
                  }} />
                  <span>(s) </span>
                  <label > {'<||'}</label>
                  <input id="endOffset" ref={endOffsetRef} class='offset' type="number" step="0.1" value={
                    (() => {
                      const idx = getIndex()
                      if (!idx) {
                        return 0
                      }
                      return !getFileData()?.card?.[idx]?.endOffset ? 0 : getFileData()?.card?.[idx]?.endOffset
                    })()
                  } onInput={(e) => {
                    console.log(e.target.value)
                    batch(async () => {
                      setFileData((i) => {
                        const idx = getIndex()
                        if (idx == undefined) {
                          return i
                        }
                        if (parseFloat(e.target.value) == 0) {
                          delete i.card[idx].endOffset
                        } else {
                          i.card[idx].endOffset = e.target.value
                        }
                        return { ...i }
                      })
                    })
                    endOffsetRef.focus()
                  }} />
                  <span>(s)</span>
                  <label > {'||'} </label>
                  <input id="begin" ref={beginRef} class='offset' type="number" step="0.1" min="0" max="1" value={getBeginAudio()} onInput={(e) => {
                    console.log(e.target.value)
                    if (parseFloat(e.target.value) > 1) {
                      e.target.value = "0." + parseFloat(e.target.value)
                    }
                    setBeginAudio(parseFloat(e.target.value))
                    beginRef.focus()
                  }} />
                  <span>(%)</span>
                </div>

                <Show
                  when={getIsWarning()}
                >
                  <div class="warning">Warning: 时间戳偏移量调过头了............</div>
                </Show>

                <br />
                <div class='deck'>
                  {
                    ((): any => {
                      const idx = getIndex()
                      if (idx === undefined) {
                        return ""
                      }
                      return (<div> {getFileData()?.card?.[idx]?.deck_name.split("::").at(-1)}</div>)

                    })()
                  }
                </div>

                <br />
                <Show
                  when={getIsFront()}
                >
                  {''}
                </Show>



                <div>{
                  (() => {
                    const idx = getIndex()
                    if (idx === undefined) {
                      audioRef.pause()
                      return (
                        <div>{'today done'}</div>
                      )
                    }
                    else {
                      return (
                        <Show when={!getIsFront()}>
                          {
                            getFileData()?.card?.[idx]?.text?.['en']
                          }
                          <br />
                          <br />
                          {
                            getFileData()?.card?.[idx]?.text?.['zh-cn']
                          }
                        </Show>
                      )
                    }
                  })()
                }
                </div>

                <br />
              </div>
            </div>
          </Show>
        </div>

        <br />


        <Show
          when={getIsFront() && getIndex() !== undefined}
        >
          <button id="showAnswer" class='showAnswer' onclick={() => {
            setIsFront(false)
          }}>{'show answer'}</button>
        </Show>

        <Show
          when={!getIsFront()}
        >

          <Show when={getIndex() !== undefined}>
            <button id="rating1" onClick={() => {
              if (getIndex() === undefined) return

              showRating(1, true)
              setBeginAudio(0)
              setIsFront(true)
            }}>
              {getRating()[1] ? getRating()[1] : 'rating1'}
            </button>
            <button id="rating2" onClick={() => {
              if (getIndex() === undefined) return

              showRating(2, true)
              setBeginAudio(0)
              setIsFront(true)
            }}>
              {getRating()[2] ? getRating()[2] : 'rating2'}
            </button>
            <button id="rating3" onClick={() => {
              if (getIndex() === undefined) return

              showRating(3, true)
              setBeginAudio(0)
              setIsFront(true)
            }}>
              {getRating()[3] ? getRating()[3] : 'rating3'}
            </button>
            <button id="rating4" onClick={() => {
              if (getIndex() === undefined) return

              showRating(4, true)
              setBeginAudio(0)
              setIsFront(true)
            }}>
              {getRating()[4] ? getRating()[4] : 'rating4'}
            </button>
          </Show>
        </Show>

        <div ref={logRef} class='scroll'>

          <Show when={getIsLogsFilter()}>
            <For each={getLogsCsvExtend()}>
              {(log) => (
                <div >
                  {log}
                </div>
              )}
            </For>
          </Show>
          <Show when={!getIsLogsFilter()}>
            <For each={getLogsCsv()}>
              {(log) => (
                <div >
                  {log}
                </div>
              )}
            </For>
          </Show>

        </div>
      </div>
    </>
  )
}

export default App
