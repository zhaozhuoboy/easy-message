import ajax from "@/utils/http"
export const createRoom = (data: {password: string}) => {
  return ajax({
    url: '/api/room/create',
    method: 'POST',
    data
  })
}