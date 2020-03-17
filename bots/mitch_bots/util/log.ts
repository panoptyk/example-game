
function log(message: string, type = "[___] ") {
  console.log(type + message);
}

namespace log {
  export const KB = "[KB ] ";
  export const ACT = "[ACT] ";
}

export { log };