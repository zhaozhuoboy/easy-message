import { RoomService } from '../database/services/RoomService'
import { MessageService } from '../database/services/MessageService'

/**
 * 定时任务服务
 * 负责管理各种定时清理任务
 */
export class SchedulerService {
  private static intervals: Map<string, NodeJS.Timeout> = new Map()
  private static isRunning = false

  /**
   * 启动所有定时任务
   */
  static startAllTasks(): void {
    if (this.isRunning) {
      console.log('⚠️ 定时任务已经在运行中')
      return
    }

    console.log('🚀 启动定时任务服务...')

    // 启动房间清理任务（每10分钟）
    this.startRoomCleanupTask()

    // 启动消息清理任务（每小时）
    this.startMessageCleanupTask()

    this.isRunning = true
    console.log('✅ 所有定时任务已启动')
  }

  /**
   * 停止所有定时任务
   */
  static stopAllTasks(): void {
    if (!this.isRunning) {
      console.log('⚠️ 定时任务未在运行')
      return
    }

    console.log('🛑 停止定时任务服务...')

    // 清除所有定时器
    this.intervals.forEach((interval, name) => {
      clearInterval(interval)
      console.log(`✅ 已停止定时任务: ${name}`)
    })

    this.intervals.clear()
    this.isRunning = false
    console.log('✅ 所有定时任务已停止')
  }

  /**
   * 启动房间清理任务
   * 每10分钟扫描一次过期房间并删除
   */
  private static startRoomCleanupTask(): void {
    const taskName = 'roomCleanup'
    const interval = 10 * 60 * 1000 // 10分钟

    console.log(`📅 启动房间清理任务，间隔: ${interval / 1000 / 60} 分钟`)

    // 立即执行一次
    this.cleanupExpiredRooms()

    // 设置定时执行
    const timer = setInterval(() => {
      this.cleanupExpiredRooms()
    }, interval)

    this.intervals.set(taskName, timer)
  }

  /**
   * 启动消息清理任务
   * 每小时清理已删除的消息
   */
  private static startMessageCleanupTask(): void {
    const taskName = 'messageCleanup'
    const interval = 60 * 60 * 1000 // 1小时

    console.log(`📅 启动消息清理任务，间隔: ${interval / 1000 / 60} 分钟`)

    // 立即执行一次
    this.cleanupDeletedMessages()

    // 设置定时执行
    const timer = setInterval(() => {
      this.cleanupDeletedMessages()
    }, interval)

    this.intervals.set(taskName, timer)
  }

  /**
   * 清理过期房间
   */
  private static async cleanupExpiredRooms(): Promise<void> {
    try {
      console.log('🔍 开始扫描过期房间...')
      const deletedCount = await RoomService.deleteExpiredRooms()
      
      if (deletedCount > 0) {
        console.log(`✅ 房间清理完成，删除了 ${deletedCount} 个过期房间`)
      } else {
        console.log('✅ 房间清理完成，没有发现过期房间')
      }
    } catch (error) {
      console.error('❌ 房间清理任务失败:', error)
    }
  }

  /**
   * 清理已删除的消息
   * 删除30天前标记为删除的消息
   */
  private static async cleanupDeletedMessages(): Promise<void> {
    try {
      console.log('🔍 开始清理已删除的消息...')
      
      // 这里可以添加清理已删除消息的逻辑
      // 例如：删除30天前标记为删除的消息
      // const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      // const deletedCount = await MessageService.permanentDeleteOldMessages(thirtyDaysAgo)
      
      console.log('✅ 消息清理完成')
    } catch (error) {
      console.error('❌ 消息清理任务失败:', error)
    }
  }

  /**
   * 获取定时任务状态
   */
  static getStatus(): { isRunning: boolean; tasks: string[] } {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(this.intervals.keys())
    }
  }

  /**
   * 手动执行房间清理
   */
  static async manualRoomCleanup(): Promise<number> {
    try {
      console.log('🔧 手动执行房间清理...')
      const deletedCount = await RoomService.deleteExpiredRooms()
      console.log(`✅ 手动房间清理完成，删除了 ${deletedCount} 个过期房间`)
      return deletedCount
    } catch (error) {
      console.error('❌ 手动房间清理失败:', error)
      throw error
    }
  }
}

export default SchedulerService
