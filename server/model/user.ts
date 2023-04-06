interface BaseUser {
    avatar: string
    email: string //unique
    username: string //unique
}

export interface UserRequest extends BaseUser {
    hashedPass: string
}

export interface User extends BaseUser {
    hashedPass?: string
    registrationDate: Date
}