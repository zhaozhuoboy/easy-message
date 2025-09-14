import { RoomService } from '../database/services/RoomService'

/**
 * 定时任务服务
 * 提供手动清理操作和状态查询
 * 注意：自动定时任务已改为使用外部 Cron
 */
export class SchedulerService {
  private static isRunning = false

  /**
   * 启动所有定时任务（已弃用，使用外部 Cron）
   */
  static startAllTasks(): void {
    console.log('⚠️ 内置定时任务已弃用，请使用外部 Cron 任务')
    this.isRunning = true
  }

  /**
   * 停止所有定时任务（已弃用）
   */
  static stopAllTasks(): void {
    console.log('⚠️ 内置定时任务已弃用，请使用外部 Cron 任务')
    this.isRunning = false
  }

  /**
   * 获取定时任务状态
   */
  static getStatus(): { isRunning: boolean; tasks: string[]; note: string } {
    return {
      isRunning: this.isRunning,
      tasks: ['external-cron'],
      note: '使用外部 Cron 任务进行清理'
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
