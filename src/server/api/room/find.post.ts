import { defineEventHandler } from 'h3'
import { RoomService } from '~/server/database/services/RoomService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log('request body', body)
  if (!body.room_id) {
    return {
      code: -2000,
      message: '缺少参数 room_id'
    }
  }
  try {
    const roomInfo = await RoomService.findByRoomId(body.room_id)
    if (!roomInfo) {
      return {
        code: -2001,
        message: '房间不存在'
      }
    }

    const room = roomInfo.get();
    const res = {
      room_id: room.room_id,
      is_private: room.is_private
    }
    return {
      code: 0,
      data: res,
      message: 'success'
    }
  } catch (err) {
    return {
      code: -3000,
      message: '查询失败'
    }
  }
})