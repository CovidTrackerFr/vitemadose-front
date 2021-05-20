

export const setDebouncedInterval = function(handler: Function, duration?: number, ...args: any[]) {
    let ongoingHandler = false;
    return setInterval(async () => {
        if(ongoingHandler) {
            console.warn("Skipped setDebouncedInterval()'s handler as ongoing already");
            return;
        }
        try {
            ongoingHandler = true;
            await handler(...args);
        } finally {
            ongoingHandler = false;
        }
    }, duration);
}

export function delay (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
