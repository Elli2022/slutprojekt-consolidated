export interface StatusUpdate {
    status: string;
    timestamp: string;
  }
  
 export interface UserInfo {
    userName: string;
    password: string;
    status: string;
    imageurl: string;
    newUser: boolean;
    statusUpdates: StatusUpdate[];
  };
  

export interface FirebaseResponse {
    [key: string]: UserInfo;
}
