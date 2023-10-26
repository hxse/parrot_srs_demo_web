import { GamepadListener } from 'gamepad.js';




export async function init_keyboard() {
    const listener = new GamepadListener({
        analog: false,
        deadZone: 0.3
    });

    listener.on('gamepad:connected', (event: any) => {
        const {
            index, // Gamepad index: Number [0-3].
            gamepad, // Native Gamepad object.
        } = event.detail;
        console.log('connected', index, gamepad)
    });

    listener.on('gamepad:axis', (event: any) => {
        const {
            index,// Gamepad index: Number [0-3].
            axis, // Axis index: Number [0-N].
            value, // Current value: Number between -1 and 1. Float in analog mode, integer otherwise.
            gamepad, // Native Gamepad object
        } = event.detail;
        console.log('axis', index, axis, value, gamepad)

        if (axis == 1 && value == 1) {
            const el: HTMLElement | null = document.querySelector('#forward')
            if (el) {
                el.click()
            }
        }
        if (axis == 1 && value == -1) {
            const el: HTMLElement | null = document.querySelector('#backward')
            if (el) {
                el.click()
            }
        }
        if (axis == 0 && value == -1) {
            const el: HTMLElement | null = document.querySelector('#forward2')
            if (el) {
                el.click()
            }
        }
        if (axis == 0 && value == 1) {
            const el: HTMLElement | null = document.querySelector('#backward2')
            if (el) {
                el.click()
            }
        }
    });

    listener.on('gamepad:button', (event: any) => {
        const {
            index,// Gamepad index: Number [0-3].
            button, // Button index: Number [0-N].
            value, // Current value: Number between 0 and 1. Float in analog mode, integer otherwise.
            pressed, // Native GamepadButton pressed value: Boolean.
            gamepad, // Native Gamepad object
        } = event.detail;
        console.log('button', index, button, value, pressed, gamepad)
        if (button == 2 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#rating1')
            if (el) {
                console.log('click', "rating1")
                el.click()
            } else {
                const el: HTMLElement | null = document.querySelector('#showAnswer')
                if (el) {
                    console.log('click', "showAnswer")
                    el.click()
                }
            }
        }
        if (button == 0 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#rating3')
            if (el) {
                el.click()
            } else {
                const el: HTMLElement | null = document.querySelector('#showAnswer')
                if (el) {
                    console.log('click', "showAnswer")
                    el.click()
                }
            }
        } if (button == 3 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#backward')
            if (el) {
                el.click()
            }
            // const el: HTMLElement | null = document.querySelector('#rating2')
            // if (el) {
            //     el.click()
            // } else {
            //     const el: HTMLElement | null = document.querySelector('#showAnswer')
            //     if (el) {
            //         console.log('click', "showAnswer")
            //         el.click()
            //     }
            // }
        }
        if (button == 1 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#forward')
            if (el) {
                el.click()
            }
            // const el: HTMLElement | null = document.querySelector('#rating4')
            // if (el) {
            //     el.click()
            // } else {
            //     const el: HTMLElement | null = document.querySelector('#showAnswer')
            //     if (el) {
            //         console.log('click', "showAnswer")
            //         el.click()
            //     }
            // }
        }
        if (button == 5 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#play')
            if (el) {
                el.click()
            }
        }
        if (button == 4 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#undo')
            if (el) {
                el.click()
            }
        }
        if (button == 9 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#pause')
            if (el) {
                el.click()
            }
        }
    });

    listener.start();

    runKeyBoard()
}

function runKeyBoard() {
    document.addEventListener('keydown', function (event) {
        if (event.key == "a" || event.key == "A") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#rating1')
            if (el) {
                console.log('click', "rating1")
                el.click()
            } else {
                const el: HTMLElement | null = document.querySelector('#showAnswer')
                if (el) {
                    console.log('click', "showAnswer")
                    el.click()
                }
            }
        }
        if (event.key == "s" || event.key == "S") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#rating2')
            if (el) {
                console.log('click', "rating2")
                el.click()
            } else {
                const el: HTMLElement | null = document.querySelector('#showAnswer')
                if (el) {
                    console.log('click', "showAnswer")
                    el.click()
                }
            }
        }
        if (event.key == "d" || event.key == "D") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#rating3')
            if (el) {
                console.log('click', "rating3")
                el.click()
            } else {
                const el: HTMLElement | null = document.querySelector('#showAnswer')
                if (el) {
                    console.log('click', "showAnswer")
                    el.click()
                }
            }
        }
        if (event.key == "f" || event.key == "F") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#rating4')
            if (el) {
                console.log('click', "rating4")
                el.click()
            } else {
                const el: HTMLElement | null = document.querySelector('#showAnswer')
                if (el) {
                    console.log('click', "showAnswer")
                    el.click()
                }
            }
        }
        if (event.key == "q" || event.key == "Q") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#stop')
            if (el) {
                el.click()
            }
        }
        if (event.key == "w" || event.key == "W" || event.key == " ") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#play')
            if (el) {
                el.click()
            }
        }
        if (event.key == "e" || event.key == "E") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#backward')
            if (el) {
                el.click()
            }
        }
        if (event.key == "r" || event.key == "R") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#forward')
            if (el) {
                el.click()
            }
        }
        if (event.key == "c" || event.key == "C") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#backward2')
            if (el) {
                el.click()
            }
        }
        if (event.key == "v" || event.key == "V") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#forward2')
            if (el) {
                el.click()
            }
        }
        if (event.key == "t" || event.key == "T") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#pause')
            if (el) {
                el.click()
            }
        }
        if (event.key == "g" || event.key == "G") {
            event.preventDefault();
            const el: HTMLElement | null = document.querySelector('#undo')
            if (el) {
                el.click()
            }
        }
    });
}
