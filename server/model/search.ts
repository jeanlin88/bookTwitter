import { Query } from "express-serve-static-core"


export interface Search extends Query {
    keywords: string[]
    author?: string
    labels: string[]
};