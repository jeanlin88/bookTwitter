export interface bookList {
    books: string[]
    description: string
    name: string
    public: boolean
};

export interface User {
    avatar: string
    blockList: string[]
    bookLists: bookList[]
    email: string
    favoriteBookLists: string[]
    favoriteBooks: string[]
    registrationDate: Date
    username: string
};