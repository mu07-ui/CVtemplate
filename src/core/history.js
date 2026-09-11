/**
 * 撤销/重做历史栈
 * 覆盖验收标准：AC-5.1 ~ AC-5.2
 */

const MAX = 50

/**
 * 创建历史栈实例
 * undo 返回回退后落到的状态；redo 反之；
 * undo 后 push 会截断重做分支；栈上限 50 条，超限丢弃最旧记录。
 */
export function createHistory() {
  let states = []
  let ptr = -1

  return {
    push(state) {
      states = states.slice(0, ptr + 1)
      states.push(state)
      if (states.length > MAX) states.shift()
      ptr = states.length - 1
    },
    undo() {
      if (ptr > 0) {
        ptr -= 1
        return states[ptr]
      }
      return null
    },
    redo() {
      if (ptr < states.length - 1) {
        ptr += 1
        return states[ptr]
      }
      return null
    },
    canUndo: () => ptr > 0,
    canRedo: () => ptr < states.length - 1,
    reset: () => { states = []; ptr = -1 },
  }
}
