
function log(message: string, type = "[___] ") {
  if (log.ignore.includes(type)) {
    return;
  }
  console.log(type + message);
}

namespace log {
  export const KB = "[ K B ] ";
  export const ACT = "[ ACT ] ";
  export const STATE = "[STATE] ";
  export const ignore = [];
}

export { log };