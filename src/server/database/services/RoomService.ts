import { Op } from 'sequelize'
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

  /**
   * 删除过期的房间
   * @returns 删除的房间数量
   */
  static async deleteExpiredRooms(): Promise<number> {
    try {
      const now = new Date()
      
      // 查找所有过期的房间
      const expiredRooms = await RoomModel.findAll({
        where: {
          expired_time: {
            [Op.lt]: now // 过期时间小于当前时间
          }
        }
      })

      if (expiredRooms.length === 0) {
        console.log('📋 没有发现过期的房间')
        return 0
      }

      // 删除过期房间
      const deletedCount = await RoomModel.destroy({
        where: {
          expired_time: {
            [Op.lt]: now
          }
        }
      })

      console.log(`🗑️ 已删除 ${deletedCount} 个过期房间`)
      return deletedCount
    } catch (error) {
      console.error('❌ 删除过期房间失败:', error)
      throw error
    }
  }

  /**
   * 获取过期房间数量（用于监控）
   * @returns 过期房间数量
   */
  static async getExpiredRoomsCount(): Promise<number> {
    try {
      const now = new Date()
      const count = await RoomModel.count({
        where: {
          expired_time: {
            [Op.lt]: now
          }
        }
      })
      return count
    } catch (error) {
      console.error('❌ 获取过期房间数量失败:', error)
      throw error
    }
  }
}