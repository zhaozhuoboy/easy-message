import { defineEventHandler } from 'h3'
import { SchedulerService } from '~/server/services/SchedulerService'
import { RoomService } from '~/server/database/services/RoomService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action } = body

    switch (action) {
      case 'cleanup-rooms':
        // 手动清理过期房间
        const deletedCount = await SchedulerService.manualRoomCleanup()
        return {
          code: 0,
          message: '房间清理完成',
          data: {
            deletedCount,
            action: 'cleanup-rooms'
          }
        }

      case 'status':
        // 获取定时任务状态
        const status = SchedulerService.getStatus()
        const expiredCount = await RoomService.getExpiredRoomsCount()
        
        return {
          code: 0,
          message: '获取状态成功',
          data: {
            scheduler: status,
            expiredRoomsCount: expiredCount
          }
        }

      case 'start-tasks':
        // 启动定时任务
        SchedulerService.startAllTasks()
        return {
          code: 0,
          message: '定时任务已启动',
          data: {
            action: 'start-tasks'
          }
        }

      case 'stop-tasks':
        // 停止定时任务
        SchedulerService.stopAllTasks()
        return {
          code: 0,
          message: '定时任务已停止',
          data: {
            action: 'stop-tasks'
          }
        }

      default:
        return {
          code: -1,
          message: '不支持的操作',
          data: null
        }
    }
  } catch (error) {
    console.error('管理操作失败:', error)
    let errorMessage = '操作失败'
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage
    }
    return {
      code: -1,
      message: errorMessage,
      data: null
    }
  }
})
