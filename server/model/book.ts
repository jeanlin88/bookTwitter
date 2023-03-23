export interface BookReview {
    content: string
    createTime: Date
    rank: number
    username: string
};

export interface BookRequest {
    authors: string[]
    coverImage: string
    description: string
    labels: string[]
    title: string
};

export interface Book extends BookRequest{
    reviews?: BookReview[]
};

export interface Booklist {
    books: string[]
    description: string
    name: string
    public: boolean
};