declare module '#auth-utils' {
  interface User {
    id: number
    login: string
    name: string | null
    avatarUrl: string | null
  }

  interface UserSession {
    loggedInAt?: Date
  }

  interface SecureSessionData {
    /** GitHub OAuth access token (server-only); used to sync app installations. */
    githubAccessToken?: string
  }
}

export {}
