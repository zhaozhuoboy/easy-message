import { defineEventHandler } from 'h3'
import { RoomService } from '~/server/database/services/RoomService'

export function generateRandomRoomId(): string {
  // 生成0-999999之间的随机整数
  const randomNum = Math.floor(Math.random() * 1000000);
  
  // 转换为字符串并补零到6位
  return randomNum.toString().padStart(6, '0');
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { password } = body
  // 随机生成 6 位数字的字符串
  body.room_id = generateRandomRoomId()

  if (password) {
    body.is_private = true
  }
  try {
    const room = await RoomService.createRoom(body)
    return {
      code: 0,
      message: 'success',
      data: room
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    return {
      code: -1000,
      message: '创建房间失败',
      data: null
    }
  }
})