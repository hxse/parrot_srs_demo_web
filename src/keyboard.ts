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
                el.click()
            }
        }
        if (button == 0 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#rating3')
            if (el) {
                el.click()
            }
        } if (button == 3 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#rating2')
            if (el) {
                el.click()
            }
        }
        if (button == 1 && pressed == true) {
            const el: HTMLElement | null = document.querySelector('#rating4')
            if (el) {
                el.click()
            }
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

    // if (!navigator.getGamepads) {
    //     // Browser supports the Gamepad API
    //     console.log("浏览器不支持gamepads")
    // }
    // window.addEventListener("gamepadconnected", function (e) {
    //     const gp = navigator.getGamepads()[e.gamepad.index];
    //     console.log(
    //         "控制器已连接于 %d 位：%s. %d 个按钮，%d 个坐标方向。",
    //         gp?.index,
    //         gp?.id,
    //         gp?.buttons.length,
    //         gp?.axes.length,
    //     );
    // });

    // window.addEventListener('gamepadconnected', (event) => {
    //     const update = () => {
    //         for (const gamepad of navigator.getGamepads()) {
    //             if (!gamepad) continue;
    //             for (const [index, axis] of gamepad.axes.entries()) {
    //                 if (axis == -1) {
    //                     console.log(index, -1)
    //                 }
    //                 if (axis == 1) {
    //                     console.log(index, 1)
    //                 }
    //             }
    //             for (const [index, button] of gamepad.buttons.entries()) {
    //                 // console.log(index, gamepad.index, button.value, button.touched, button.pressed,)
    //                 if (button.value) {
    //                     console.log(index, button.pressed)
    //                 }
    //             }
    //         }
    //         requestAnimationFrame(update);
    //     };
    //     update();
    // });
}
