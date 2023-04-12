import { Query } from "express-serve-static-core"
import { Reviewable, Updatable } from "./general"
import { Review } from "./review"

export interface BaseBook {
  authors: string[]
  coverImage: string
  description: string
  labels: string[],
  title: string
}

export interface BookRequest extends BaseBook, Reviewable { }

export interface Book extends BookRequest, Updatable { }

export interface BaseBooklist {
  books: string[]
  description: string
  labels: string[]
  name: string
  public: boolean
  username: string
}

export interface BooklistRequest extends BaseBooklist, Reviewable { }

export interface Booklist extends BooklistRequest, Updatable { }

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
