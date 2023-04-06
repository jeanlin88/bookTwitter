import { Query } from "express-serve-static-core"
import { Review } from "./review"

export interface Book {
  authors: string[]
  coverImage: string
  description: string
  labels: string[]
  title: string
  reviews?: Review[]
}

export interface Booklist {
  books: string[]
  description: string
  labels: string[]
  name: string
  public: boolean
  username: string
  reviews: Review[]
}

export interface BooklistField {
  labels: string[]
}

export interface BookField extends BooklistField {
  authors: string[]
}

export interface BooklistSearch extends Query {
  keywords?: string[]
  labels?: string[]
}

export interface BookSearch extends BooklistSearch {
  author?: string
}
