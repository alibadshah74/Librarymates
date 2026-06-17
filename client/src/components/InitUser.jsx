import { useAuth } from "@clerk/clerk-react"
import { useDispatch } from "react-redux"
import { fetchUser } from "../features/user/userSlice.js"
import { useEffect } from "react"

const InitUser = () => {
  const { isLoaded, userId, getToken } = useAuth()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!isLoaded || !userId) return

    const loadData = async () => {
      const token = await getToken()
      if (!token) return

      dispatch(fetchUser(token))
    }

    loadData()
  }, [isLoaded, userId])

  return null
}

export default InitUser
