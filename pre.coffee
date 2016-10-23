"use strict"

globalObj = (this || 0).self || global

unless globalObj.Module?
  globalObj.Module = {preRun: []}

stdoutBuffer = ""

stdinQueue = []
pushStdin = (str)=>
  stdinQueue.push(str)

dequeueStdin = ()=>
  stdinQueue.splice(0,1)[0]

globalObj.onmessage = (e)=>
  if e.data.stdin
    stdinWrite(e.data.stdin)

stdinWrite = pushStdin

fgetsHook = (buf_idx, n, stream) ->
  return { hasResult: false, result: null } unless stream == 1

  result = EmterpreterAsync.handle (resume) ->
    res = ->
      str = dequeueStdin()
      HEAP8[buf_idx + i] = str.charCodeAt(i) for i in [0...str.length]
      buf_idx

    if stdinQueue.length > 0
      resume(res)
    else
      stdinWrite = (str)->
        stdinWrite = pushStdin
        pushStdin(str)
        resume(res)

  { hasResult: true, result: result }

pollHook = (fds, nfds, timeout) ->
  return { hasResult: true, result: 0}

outputHandler = (chr)->
  if chr
    stdoutBuffer += String.fromCharCode(chr)
    return unless chr == 0x0a

  globalObj.postMessage({stdout: stdoutBuffer})
  stdoutBuffer = ""

Module.preRun.push ->
  return if FS.init.initialized

  Module.fgetsHook = fgetsHook
  Module.pollHook = pollHook
  FS.init(null, outputHandler)
