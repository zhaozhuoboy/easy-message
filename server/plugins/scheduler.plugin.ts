import { SchedulerService } from '../services/SchedulerService'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

/**
 * 定时任务插件
 * 提供多种调度方式
 */
export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()
  
  // 只在生产环境或明确启用时启动定时任务
  const enableScheduler = config.scheduler?.enabled !== false
  
  if (!enableScheduler) {
    console.log('⏸️ 定时任务已禁用')
    return
  }

  // 选择调度方式
  const schedulerType = config.scheduler?.type || 'internal' // internal, external, cron

  switch (schedulerType) {
    case 'internal':
      // 使用内置定时任务（当前方案）
      console.log('🔄 使用内置定时任务')
      SchedulerService.startAllTasks()
      break

    case 'external':
      // 使用外部脚本
      console.log('🔧 使用外部脚本调度')
      startExternalScheduler()
      break

    case 'cron':
      // 使用系统 Cron
      console.log('⏰ 使用系统 Cron 调度')
      console.log('请确保已配置 crontab 任务')
      break

    default:
      console.log('⚠️ 未知的调度类型，使用默认内置调度')
      SchedulerService.startAllTasks()
  }
})

/**
 * 启动外部脚本调度
 */
function startExternalScheduler() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'cleanup-rooms.js')
  
  // 每10分钟执行一次外部脚本
  setInterval(async () => {
    try {
      console.log('🔧 执行外部清理脚本...')
      const { stdout, stderr } = await execAsync(`node ${scriptPath}`)
      
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
      
    } catch (error) {
      console.error('❌ 外部脚本执行失败:', error)
    }
  }, 10 * 60 * 1000) // 10分钟
}
