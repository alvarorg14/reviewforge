export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/app')) return
  const { loggedIn, fetch } = useUserSession()
  await fetch()
  if (!loggedIn.value) {
    return navigateTo('/')
  }
})
