import { useAuth } from "@clerk/clerk-react"
import { useDispatch } from "react-redux"
import { fetchUser } from "../features/user/userSlice.js"
import { fetchConnections } from "../features/connections/connectionsSlice.js"
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
      dispatch(fetchConnections(token))
    }

    loadData()
  }, [isLoaded, userId])

  return null
}

export default InitUser
