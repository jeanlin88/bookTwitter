export interface BookReview {
    content: string
    createTime: Date
    rank: number
    username: string
};

export interface Book {
    authors: string[]
    coverImage: string
    description: string
    labels: string
    reviews: BookReview[]
    title: string
};

export interface Booklist {
    books: string[]
    description: string
    name: string
    public: boolean
};
