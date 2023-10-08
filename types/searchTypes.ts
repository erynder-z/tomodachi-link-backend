import { MinimalUserTypes } from './minimalUserTypes';

export type SearchResultUserType = MinimalUserTypes;

export type SearchResultPostType = {
    _id: string;
    text: string;
    updatedAt: Date;
};

export type SearchResultPollType = {
    _id: string;
    question: string;
    description?: string;
    updatedAt: Date;
};

export type AllSearchResultsType = {
    type: 'user' | 'post' | 'poll';
    data: SearchResultUserType | SearchResultPostType | SearchResultPollType;
};
