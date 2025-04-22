import asyncio
from threading import Thread

__loop = None

def get_loop():
    global __loop
    if __loop is None:
        __loop = asyncio.new_event_loop()

        def start_backgroud_loop():
            asyncio.set_event_loop(__loop)
            if not __loop.is_running():
                __loop.run_forever()
        thread = Thread(target=start_backgroud_loop, daemon=True)
        thread.start()
    
    return __loop

def wait_for(coro):
    return asyncio.run_coroutine_threadsafe(coro, get_loop()).result()