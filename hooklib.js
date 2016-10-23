mergeInto(LibraryManager.library, {
  fgets__deps: ['$EmterpreterAsync'],
  fgets: function (s, n, stream) {
    if (typeof Module.fgetsHook !== "undefined" && Module.fgetsHook){
      res = Module.fgetsHook(s, n, stream);
      if (res.hasResult) return res.result;
    }

    // char *fgets(char *restrict s, int n, FILE *restrict stream);
    // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
    var streamObj = FS.getStreamFromPtr(stream);
    if (!streamObj) return 0;
    if (streamObj.error || streamObj.eof) return 0;
    var byte_;
    for (var i = 0; i < n - 1 && byte_ != 10; i++) {
      byte_ = _fgetc(stream);
      if (byte_ == -1) {
        if (streamObj.error || (streamObj.eof && i == 0)) return 0;
        else if (streamObj.eof) break;
      }
      HEAP8[(((s)+(i))>>0)]=byte_;
    }
    HEAP8[(((s)+(i))>>0)]=0;
    return s;
  },

  poll__deps: ['$EmterpreterAsync'],
  poll: function _poll(fds, nfds, timeout) {
    if (typeof Module.pollHook !== "undefined" && Module.pollHook){
      res = Module.pollHook(fds, nfds, timeout);
      if (res.hasResult) return res.result;
    }

    // int poll(struct pollfd fds[], nfds_t nfds, int timeout);
    // http://pubs.opengroup.org/onlinepubs/009695399/functions/poll.html
    var nonzero = 0;
    for (var i = 0; i < nfds; i++) {
      var pollfd = fds + 8 * i;
      var fd = HEAP32[((pollfd)>>2)];
      var events = HEAP16[(((pollfd)+(4))>>1)];
      var mask = 32;
      var stream = FS.getStream(fd);
      if (stream) {
        mask = 5;
        if (stream.stream_ops.poll) {
          mask = stream.stream_ops.poll(stream);
        }
      }
      mask &= events | 8 | 16;
      if (mask) nonzero++;
      HEAP16[(((pollfd)+(6))>>1)]=mask;
    }
    return nonzero;
  },
});
