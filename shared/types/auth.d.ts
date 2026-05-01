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

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- augmentation anchor
  interface SecureSessionData {}
}

export {}
