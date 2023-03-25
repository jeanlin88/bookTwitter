export interface BookRequest {
  authors: string[]
  coverImage: string
  description: string
  labels: string[]
  title: string
}

export interface Book extends BookRequest {
  reviews?: BookReview[]
}

export interface BookField {
  _id: string,
  authors: string[],
  labels: string[]
}

export interface BookReview {
  content: string
  createTime: Date
  rank: number
  username: string
};

export interface Booklist {
  books: string[]
  description: string
  name: string
  public: boolean
};