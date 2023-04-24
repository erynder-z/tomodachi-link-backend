export type FriendType = {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    userpic: { data: Buffer; contentType: string };
    mutual_friends: number;
};