import { defineEventHandler } from "h3"
import chalk from "chalk"

export default defineEventHandler(async (event) => {
  console.log(chalk.bgGreen('== log middleware =='))
  console.log(chalk.green(`${event.method}:${event.node.req.url}`))
})
