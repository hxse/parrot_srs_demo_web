import { createSignal, createEffect, on, Show, batch, onMount, For, Switch, Match } from 'solid-js'

import solidLogo from './assets/solid.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { openFile, openDir, getFile, saveFile, downloadFile, saveFileSystem, readFilSystem, deleteFileSystem, parseDir, downloadBlob } from "./file_io.ts"
import { saveIndexeddb, store } from './idb_io.ts'
import { initFsrs, newCard, schedulingCard, repeatCard, parseFsrsObj } from "./fsrs-api.ts"
import { createZip, compatibleZip, createFile } from './convert-zip.ts'
import jsZip from 'jszip'
import {
  dateDiff, dateTimeDiff, dayDiff, dayTimeDiff,
  addDateTimeDiff, addDayTimeDiff
} from "date-differencer";

function sameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

function datediff(first, second) {
  first.setSeconds(first.getSeconds() - 3);//error
  const diff = dateTimeDiff(first, second)
  return diff.years > 0 ? diff.years + 'Y' : diff.months > 0 ? diff.months + 'M' : diff.days > 0 ? diff.days + 'D' : diff.minutes + 'm'
}

function createCardId(card, length = 7) {
  if (!card.card_id) {
    const randomStr = Array(length).fill(0).map(x => Math.random().toString(36).charAt(2)).join('')
    const d = new Date()
    const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, 0) + String(d.getDate()).padStart(2, 0) + String(d.getHours()).padStart(2, 0) + String(d.getMinutes()).padStart(2, 0) + String(d.getSeconds()).padStart(2, 0)
    card.card_id = `${dateStr}-${randomStr}`
  }
  return card.card_id
}

function preProcessing(obj) {
  obj.name = obj.name.replace(' ', '_')
  if (!obj.index) {
    obj.index = 0
  }
}

function getCacheName(file, obj) {
  return `${obj.name} ${file.name}`
}
function reSetArr(fileData) {
  const waitArr = []//已过期的旧卡
  const oldArr = []//未过期的旧卡
  const newArr = []//未学过的新卡
  const _oldArr = []//临时数组
  for (let index = 0; index < fileData.card.length; index++) {
    const card = fileData.card
    const fsrs = card[index].fsrs;
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
    waitArr, oldArr, newArr
  }

}

function App() {
  //test参数是用来测试的
  const [getTestDate, setTestDate] = createSignal<boolean>(false)
  const [getTestPreview, setTestPreview] = createSignal<boolean>(false)

  const [getIndex, setIndex] = createSignal<number>(null)
  const [getIsLoad, setIsLoad] = createSignal(false)
  const [getFileData, setFileData] = createSignal<any>({})
  const [getFileObj, setFileObj] = createSignal<any>({})
  const [getRating, setRating] = createSignal<any>({})

  const [getLogsCsv, setLogsCsv] = createSignal<Array<string>>(['card_id,review_time,review_rating,review_state,review_duration,timezone,day_start,deck_name'])
  //https://github.com/open-spaced-repetition/fsrs-optimizer
  const [getIsCacheFile, setIsCacheFile] = createSignal<boolean>(false)
  const [getIsCacheLog, setIsCacheLog] = createSignal<boolean>(false)

  const [getLimit, setLimit] = createSignal<number>(4)
  const [getLimitCur, setLimitCur] = createSignal<number>(0)

  const [getWaitArr, setWaitArr] = createSignal<Array<number>>([])
  const [getOldArr, setOldArr] = createSignal<Array<number>>([])
  const [getNewArr, setNewArr] = createSignal<Array<number>>([])

  function reSetIndex(fileData) {
    const { waitArr, oldArr, newArr } = reSetArr(fileData)

    console.log('waitArr', waitArr)
    console.log(waitArr.map((i) => fileData.card[i].fsrs.due))

    console.log('oldArr', oldArr)
    console.log(oldArr.map((i) => fileData.card[i].fsrs.due))

    console.log('newArr', newArr)
    console.log(newArr.map((i) => fileData.card[i]))


    if (waitArr.length > 0) {
      console.log('show', waitArr[0])
      return waitArr[0]
    }

    const l = [...waitArr, ...oldArr].map((i) => fileData.card[i].fsrs.last_review).filter((i) => sameDay(i, new Date()))
    setLimitCur(l.length)
    if (l.length >= getLimit()) {
      return undefined
    }


    if (newArr.length > 0) {
      console.log('show', newArr[0])
      return newArr[0]
    }


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

  async function readDir(dirHandle, mode) {
    const { fileArr, mediaArr, dirArr } = await parseDir(dirHandle, mode)

    let obj: any

    async function updateIdb() {
      await store('clear', { storeName: 'file' })
      await store('clear', { storeName: 'media' })
      for (const fileHandle of fileArr) {
        const file = await getFile(fileHandle)
        await store('put', { storeName: 'file', value: file, key: getCacheName(fileHandle, obj) })
      }
      for (const fileHandle of mediaArr) {
        const file = await getFile(fileHandle)
        await store('put', { storeName: 'media', value: file, key: getCacheName(fileHandle, obj) })
      }
    }

    let flag = false
    for (const fileHandle of fileArr) {
      if (fileHandle.name == 'config.json') {
        flag = true
        const file = await getFile(fileHandle)
        const text = await file.text()
        obj = parseFsrsObj(text);
        preProcessing(obj)
        await updateIdb()
        batch(async () => {
          setIsLoad(true)
          setFileData(obj)
          setFileObj(file)
          if (getTestPreview()) {
            setIndex(obj.index)
          } else {
            setIndex(reSetIndex(obj))
          }
        })
      }
      if (fileHandle.name == 'revlog.csv') {
        const file = await getFile(fileHandle)
        const text = await file.text()
        setLogsCsv(text.split('\n'))
      }
    }
    if (!flag) {
      const message = "文件结构不对,没找到config.json文件"
      alert(message)
      console.log(message)
    }
  }

  async function runSaveFile() {
    const fileKeys = await store('getAllKeys', { storeName: 'file' })
    const mediaKeys = await store('getAllKeys', { storeName: 'media' })
    const fileArr = []
    const mediaArr = []
    for (let fk of fileKeys) {
      const fileObj = await store('get', { storeName: 'file', key: fk })
      fileArr.push(fileObj)
    }
    for (let mk of mediaKeys) {
      const fileObj = await store('get', { storeName: 'media', key: mk })
      mediaArr.push(fileObj)
    }

    createZip('world.zip', fileArr, mediaArr)
  }

  async function runDownloadFile(text: string) {
    const str = JSON.stringify(text, null, 4)
    await downloadFile(str)
  }

  onMount(async () => {
    //todo 这里要读一下indexeddb缓存
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((persistent) => {
        if (persistent) {
          console.log("Storage will not be cleared except by explicit user action");
        } else {
          console.log("Storage may be cleared by the UA under storage pressure.");
        }
      });
    }

    initFsrs(undefined, 0.9)

    // await store('load')
    // readFileSystem('indexeddb')

    const res = await store('getAllKeys', { storeName: 'file' })
    const fileArr = []
    for (const i of res) {
      // const [deck_name, name] = [fullName.split(' ').slice(0, 1).join(' '), fullName.split(' ').slice(1).join(' ')]
      const file = await store('get', { storeName: 'file', key: i })
      fileArr.push(file)
    }
    console.log('use cache', fileArr)
    batch(async () => {
      for (const file of fileArr) {
        if (file.name == 'config.json') {
          const text = await file.text()
          const obj = parseFsrsObj(text);
          setIsCacheFile(true)
          setFileObj(file)
          setFileData(obj)
          if (getTestPreview()) {
            setIndex(obj.index)
          } else {
            setIndex(reSetIndex(obj))
          }
          setIsLoad(true)
        }
        if (file.name == 'revlog.csv') {
          const text = await file.text()
          setIsCacheLog(true)
          setLogsCsv(text.split('\n'))
        }
      }
    })

  });

  createEffect(on(getIndex, (index: string) => {
    if (index !== null) {
      setFileData((i) => {
        if (i.index == index) {
          return i
        }
        i.index = index
        return { ...i }
      })
      showRating()
    }
  }, { defer: false }));

  createEffect(on(getFileData, async (data: string) => {
    if (getIsCacheFile()) {
      console.log('load: cache getFileData')
      setIsCacheFile(false)
      return
    }
    if (getFileData().name) {
      // const file = getFileObj()
      // const file = await store('get', { storeName: "file", key: getCacheName({ 'name': 'config.json' }, obj) })
      const file = { 'name': "config.json" }//这个最简单直接,不然太麻烦了
      const obj = getFileData()
      obj.hello = "world"

      const str = JSON.stringify(obj, null, 4)
      const newFile = createFile(str, file.name)
      await store('put', { storeName: "file", value: newFile, key: getCacheName(file, obj) })
      console.log('change: fileData', getFileData())
    } else {
      console.log('init: fileData', getFileData())
    }
  }, { defer: true }));

  createEffect(on(getLogsCsv, async (data: string) => {
    if (getIsCacheLog()) {
      console.log('cache: getLogsCsv')
      setIsCacheLog(false)
      return
    }
    if (getFileData().name) {
      const file = { 'name': "revlog.csv" }//这个最简单直接,不然太麻烦了
      const obj = getLogsCsv()
      const str = obj.join('\n')
      const newFile = createFile(str, file.name)
      console.log('change: logsCsv', getFileData())
      await store('put', { storeName: "file", value: newFile, key: getCacheName(file, getFileData()) })
    } else {
      console.log('init: logsCsv', getFileData())
    }

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
      setFileData((i) => {
        i.card[idx].fsrs = card
        return { ...i }
      })
      scheduling_cards = schedulingCard(card, getTestDate())

      function updateLog() {

        const logObj = {
          card_id: createCardId(getFileData().card[idx]),
          review_time: review_log['review'].getTime(),
          review_rating: review_log['rating'],
          review_state: review_log['state'],
          review_duration: 5,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          day_start: 8,
          deck_name: getFileData().name,
        }
        const logCsv = `${logObj.card_id},${logObj.review_time},${logObj.review_rating},${logObj.review_state},${logObj.review_duration},${logObj.timezone},${logObj.day_start},${logObj.deck_name}`
        setLogsCsv((i) => {
          i.push(logCsv)
          return [...i]
        })
      }
      updateLog()
    }

    for (let num of [1, 2, 3, 4]) {
      const { card, review_log } = scheduling_cards[num]
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
          open file
        </button>
        <button onClick={async () => {
          const dirHandle = await openDir()
          await readDir(dirHandle, 'dir')
        }}>
          open dir
        </button>
        <button onclick={() => {
          // runDownloadFile(fileData())
          runSaveFile()
        }}>保存</button>
        <button onclick={() => {
          store('clear', { storeName: 'file' })
          store('clear', { storeName: 'media' })
        }}>清理缓存</button>

        <Show when={getTestDate()}>
          <button onClick={() => {
            setIndex((index) => {
              index = index - 1 < 0 ? 0 : index - 1
              return index
            })
          }}>
            prev
          </button>
          <button onClick={() => {
            setIndex((index) => {
              index = index + 1 >= getFileData().card.length - 1 ? getFileData().card.length - 1 : index + 1
              return index
            })
          }}>
            next
          </button>
        </Show>

        <div>
          {`index: ${getIndex()} fileDataIndex: ${getFileData()?.index} limitCur: ${getLimitCur()} limitMax: ${getLimit()} count: ${getFileData()?.card?.length}`}
        </div>

        <div class="text">
          <Show
            when={getIsLoad()}
            fallback={<div class="wait">please select a local file</div>}
          >
            <Switch fallback={'not find template'}>
              <Match when={getTestDate()}>
                <div>
                  {
                    getIndex() === undefined ? 'today done' : getFileData()?.card?.[getIndex()]?.text?.en
                  }
                </div>
              </Match>
              <Match when={!getTestDate()}>
                <div>
                  {
                    getIndex() === undefined ? 'today done' : getFileData()?.card?.[getIndex()]?.text?.en
                  }
                </div>
              </Match>
            </Switch>
          </Show>
        </div>

        <br />

        <Show
          when={getIndex() !== undefined}
        >
          <button onClick={() => {
            if (getIndex() === undefined) return

            showRating(1, true)

            if (!getTestPreview()) {
              const i = reSetIndex(getFileData())
              setFileData((obj) => {
                obj.index = i
                return { ...obj }
              })
              setIndex(i)
            }
          }}>
            {getRating()[1] ? getRating()[1] : 'rating1'}
          </button>
          <button onClick={() => {
            if (getIndex() === undefined) return

            showRating(2, true)

            if (!getTestPreview()) {
              const i = reSetIndex(getFileData())
              setFileData((obj) => {
                obj.index = i
                return { ...obj }
              })
              setIndex(i)
            }
          }}>
            {getRating()[2] ? getRating()[2] : 'rating2'}
          </button>
          <button onClick={() => {
            if (getIndex() === undefined) return

            showRating(3, true)

            if (!getTestPreview()) {
              const i = reSetIndex(getFileData())
              setFileData((obj) => {
                obj.index = i
                return { ...obj }
              })
              setIndex(i)
            }
          }}>
            {getRating()[3] ? getRating()[3] : 'rating3'}
          </button>
          <button onClick={() => {
            if (getIndex() === undefined) return

            showRating(4, true)

            if (!getTestPreview()) {
              const i = reSetIndex(getFileData())
              setFileData((obj) => {
                obj.index = i
                return { ...obj }
              })
              setIndex(i)
            }
          }}>
            {getRating()[4] ? getRating()[4] : 'rating4'}
          </button>
        </Show>

        <div class='scroll'>
          <For each={getLogsCsv()}>
            {(log, i) => (
              <div >
                {log}
              </div>
            )}
          </For>
        </div>
      </div>
    </>
  )
}

export default App
