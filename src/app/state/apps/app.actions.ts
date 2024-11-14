export class AdminLogin {
    static readonly type = '[auth] AdminLogin]';
    constructor(public readonly payload:any) {}
}

export class CreateAdmin {
    static readonly type = '[auth] CreateAdmin]';
    constructor(public readonly payload:any) {}
}

export class Logout {
    static readonly type = '[auth] Logout]';
}

export class AutoLogin {
    static readonly type = '[auth] AutoLogin]';
}

