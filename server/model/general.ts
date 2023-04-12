import { Review } from "./review"

export interface Reviewable {
    reviews: Review[]
}

export interface Updatable {
    updatedAt: Date
}
