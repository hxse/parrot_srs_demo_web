import { Rating, Card, SchedulingInfo, FSRS } from "fsrs.js"
// import { State, ReviewLog,   SchedulingCards, Params } from "fsrs.js"

let fsrs = new FSRS;

let rating = Rating;


export function initFsrs(w: number[] | undefined, request_retention: number) {
    // w=[0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    if (w) {
        fsrs.p.w = w
        console.log(fsrs.p.w)
    }
    if (request_retention) {
        fsrs.p.request_retention = request_retention
        console.log('request_retention', request_retention)
    }
}


export function newCard() {
    return new Card;
}

export function schedulingCard(card: any, test = false) {
    let now
    if (test) {
        now = new Date(card.due);
    } else {
        now = new Date();
    }
    let scheduling_cards = fsrs.repeat(card, now);
    return scheduling_cards
}

export function repeatCard(scheduling_cards: Record<number, SchedulingInfo>, number: number) {
    let due, state, review_log, card
    switch (number) {
        case 1:
            card = scheduling_cards[rating.Again].card
            due = card.due
            state = card.state
            review_log = scheduling_cards[rating.Again].review_log
            break;
        case 2:
            card = scheduling_cards[rating.Hard].card
            due = card.due
            state = card.state
            review_log = scheduling_cards[rating.Hard].review_log
            break;
        case 3:
            card = scheduling_cards[rating.Good].card
            due = card.due
            state = card.state
            review_log = scheduling_cards[rating.Good].review_log
            break;
        case 4:
            card = scheduling_cards[rating.Easy].card
            due = card.due
            state = card.state
            review_log = scheduling_cards[rating.Easy].review_log
            break;
        default:
            break;
    }
    return { card, due, state, review_log }
}
export function json2str(obj: any) {
    const str = JSON.stringify(obj, null, 4)
    return str
}

export function str2json(text: string) {
    function dateTimeReviver(key: string, value: any) {
        if (key == "due" || key == "last_review" || key == "firstUpdate") {
            return new Date(value);
        }
        return value;
    }
    const json = JSON.parse(text, dateTimeReviver);
    return json
}
