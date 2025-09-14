// import { Op } from 'sequelize'
import { RoomModel, RoomCreationAttributes } from '../models/RoomModel'

export class RoomService {
  /**
   * 创建房间
   * @param roomData 房间数据
   * @returns 创建的房间
   */
  static async createRoom(roomData: RoomCreationAttributes): Promise<RoomModel> {
    try {
      // 设置房间过期时间为创建时间加24小时
      const expiredTime = new Date()
      expiredTime.setHours(expiredTime.getHours() + 24)
      
      const room = await RoomModel.create({
        ...roomData,
        expired_time: expiredTime
      })
      console.log(room.get())
      return room
    } catch (error) {
      console.error('创建房间失败:', error)
      throw error
    }
  }

  /**
   * 根据房间ID查找房间
   * @param roomId 房间ID
   * @returns 房间
   */
  static async findByRoomId(roomId: string): Promise<RoomModel | null> {
    try {
      return await RoomModel.findOne({ where: { room_id: roomId } })
    } catch (error) {
      console.error('查找房间失败:', error)
      throw error
    }
  }
}