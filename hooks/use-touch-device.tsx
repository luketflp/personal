import { useMemo } from "react"

export const useTouchDevice = () => {
    const isTouchDevice = useMemo(
        () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0), []
    )

    return {
        isTouch: isTouchDevice
    }
}