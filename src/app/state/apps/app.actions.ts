import { User } from "../../models/user.model";

export class AdminLogin {
    static readonly type = '[Auth] Admin Login';
    constructor(public payload: { 
      user: User; 
      token: string; 
      refreshToken: string;
    }) {}
}

export class CreateAdmin {
    static readonly type = '[Auth] CreateAdmin';
    constructor(public readonly payload: any) {}
}

export class Logout {
    static readonly type = '[Auth] Logout';
}

export class AutoLogin {
    static readonly type = '[Auth] AutoLogin';
}