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