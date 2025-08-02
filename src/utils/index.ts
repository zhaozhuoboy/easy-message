/**
 * 随机生成一个中文名字，名字由 形容词+动物名称组成
 * 比如 可爱的小河马, 动物名称由动漫类型的名称组成
 */
export function getRandomName() {
  const adjectives = ['可爱', '聪明', '勇敢', '美丽', '善良', '温柔', '大方', '活泼', '开朗', '幽默']
  // 动漫类型的名称
  const animeNames = ['小猫', '小狗', '小兔', '小猪', '小熊', '小马', '小羊', '小牛', '小鸡', '小鸭']
  // 随机生成一个形容词
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  // 随机生成一个动漫类型的名称
  const animeName = animeNames[Math.floor(Math.random() * animeNames.length)]
  // 返回一个中文名字
  return `${adjective}的${animeName}`
}

export const setStorage = (key: string, value: any) => {
  const saveValue = typeof value === 'string' ? value : JSON.stringify(value)
  localStorage.setItem(key, saveValue)
}

export const getStorage = (key: string) => {
  const cache = localStorage.getItem(key)
  if (!cache) {
    return ''
  }
  try {
    return JSON.parse(cache)
  } catch(error) {
    console.log('getStorage error')
    return cache
  }
}

export const guid =() => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}